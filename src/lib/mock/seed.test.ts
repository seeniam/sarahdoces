// @vitest-environment node
import { describe, expect, it } from "vitest";
import { cacheInvalido, dataFortaleza, gerarSeed, TZ, VERSAO_SEED } from "./seed";
import { scoreDeRisco } from "@/lib/domain/auditoria";
import type { BancoMock } from "@/types";

// "Agora" simulado para os testes (20h em São Luís) — dia quase completo.
const AGORA = new Date("2026-10-13T20:00:00-03:00");
const banco = gerarSeed(AGORA);

function diaFortaleza(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
}
function minutosFortaleza(iso: string): number {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const num = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return num("hour") * 60 + num("minute");
}
function contagemPorDia(b: BancoMock): number[] {
  const m = new Map<string, number>();
  for (const c of b.comandas) {
    const dia = diaFortaleza(c.criadaEm);
    m.set(dia, (m.get(dia) ?? 0) + 1);
  }
  return [...m.entries()].sort(([a], [z]) => (a < z ? -1 : 1)).map(([, n]) => n);
}

describe("seed determinístico", () => {
  it("duas gerações com o mesmo instante produzem o mesmo banco", () => {
    expect(JSON.stringify(gerarSeed(AGORA))).toBe(JSON.stringify(gerarSeed(AGORA)));
  });

  it("volume plausível e 30 dias (29 anteriores + hoje)", () => {
    expect(banco.comandas.length).toBeGreaterThan(800);
    expect(banco.produtos.length).toBe(20);
    expect(contagemPorDia(banco).length).toBe(30);
  });

  it("totais por índice de dia são iguais em datas diferentes (âncora relativa)", () => {
    const a = gerarSeed(new Date("2026-10-13T14:00:00-03:00"));
    const b = gerarSeed(new Date("2026-10-20T14:00:00-03:00")); // +7 dias, mesmo horário
    expect(contagemPorDia(a)).toEqual(contagemPorDia(b));
  });

  it("hoje é parcial: às 08:00 não há comandas depois das 08:00", () => {
    const agora8 = new Date("2026-10-13T08:00:00-03:00");
    const b = gerarSeed(agora8);
    const hoje = dataFortaleza(agora8);
    const doHoje = b.comandas.filter((c) => diaFortaleza(c.criadaEm) === hoje);
    expect(doHoje.length).toBeGreaterThan(0);
    for (const c of doHoje) expect(minutosFortaleza(c.criadaEm)).toBeLessThanOrEqual(8 * 60);
  });

  it("mudar o dia ou a versão invalida o cache persistido", () => {
    const agora = new Date("2026-10-13T10:00:00-03:00");
    expect(cacheInvalido("2026-10-13", VERSAO_SEED, agora)).toBe(false);
    expect(cacheInvalido("2026-10-12", VERSAO_SEED, agora)).toBe(true);
    expect(cacheInvalido("2026-10-13", VERSAO_SEED - 1, agora)).toBe(true);
    expect(cacheInvalido(undefined, undefined, agora)).toBe(true);
  });
});

describe("anomalias plantadas (sempre nos últimos 7 dias)", () => {
  const seteDiasAtras = new Date(AGORA.getTime() - 7 * 86400_000).toISOString();

  it("Thiago cancela mais que os demais (topo do score de risco)", () => {
    const porAtendente = new Map<string, number>();
    for (const e of banco.eventos) {
      if (e.tipo === "cancelamento") {
        porAtendente.set(e.usuarioId, (porAtendente.get(e.usuarioId) ?? 0) + 1);
      }
    }
    const thiago = porAtendente.get("u-thiago") ?? 0;
    for (const [u, n] of porAtendente) if (u !== "u-thiago") expect(thiago).toBeGreaterThan(n);
    expect(scoreDeRisco(banco.eventos, banco.usuarios)[0].usuarioId).toBe("u-thiago");
  });

  it("caixa com −R$ 37,00 nos últimos 7 dias", () => {
    const ev = banco.eventos.find((e) => e.tipo === "caixa_diferenca" && e.valorImpacto === -37);
    expect(ev).toBeDefined();
    expect(ev!.data >= seteDiasAtras).toBe(true);
    expect(banco.sessoesCaixa.some((s) => s.diferenca === -37)).toBe(true);
  });

  it("carne com 2,4 kg de divergência (Loja 1) nos últimos 7 dias", () => {
    const cont = banco.contagens.find((c) => c.lojaId === "loja-1")!;
    expect(cont.data >= seteDiasAtras).toBe(true);
    expect(cont.itens.find((i) => i.insumoId === "ins-carne")!.diferenca).toBeCloseTo(-2.4);
    expect(
      banco.eventos.some((e) => e.tipo === "contagem_divergencia" && e.severidade === "critico"),
    ).toBe(true);
  });

  it("perdas de ovo acima do normal na Loja 1", () => {
    const ovo = (loja: string) =>
      banco.perdas
        .filter((p) => p.insumoId === "ins-ovo" && p.lojaId === loja)
        .reduce((s, p) => s + p.qtd, 0);
    expect(ovo("loja-1")).toBeGreaterThan(ovo("loja-2"));
  });

  it("Loja 1 responde por ~55% do faturamento", () => {
    const fat = (loja: string) =>
      banco.pagamentos.filter((p) => p.lojaId === loja).reduce((s, p) => s + p.valor, 0);
    const l1 = fat("loja-1");
    const share = l1 / (l1 + fat("loja-2"));
    expect(share).toBeGreaterThan(0.5);
    expect(share).toBeLessThan(0.62);
  });
});
