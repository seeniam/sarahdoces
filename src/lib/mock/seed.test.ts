// @vitest-environment node
import { describe, expect, it } from "vitest";
import { gerarSeed } from "./seed";
import { scoreDeRisco } from "@/lib/domain/auditoria";

const banco = gerarSeed();

describe("seed determinístico", () => {
  it("duas gerações produzem exatamente o mesmo banco", () => {
    expect(JSON.stringify(gerarSeed())).toBe(JSON.stringify(gerarSeed()));
  });

  it("gera volume plausível de movimento", () => {
    expect(banco.comandas.length).toBeGreaterThan(800);
    expect(banco.pagamentos.length).toBeGreaterThan(500);
    expect(banco.produtos.length).toBe(20);
  });
});

describe("anomalias plantadas aparecem nos dados/cálculos", () => {
  it("Thiago cancela mais que os demais (topo do score de risco)", () => {
    const cancelPorAtendente = new Map<string, number>();
    for (const e of banco.eventos) {
      if (e.tipo === "cancelamento") {
        cancelPorAtendente.set(e.usuarioId, (cancelPorAtendente.get(e.usuarioId) ?? 0) + 1);
      }
    }
    const thiago = cancelPorAtendente.get("u-thiago") ?? 0;
    const outros = [...cancelPorAtendente.entries()].filter(([u]) => u !== "u-thiago");
    for (const [, n] of outros) expect(thiago).toBeGreaterThan(n);

    const risco = scoreDeRisco(banco.eventos, banco.usuarios);
    expect(risco[0].usuarioId).toBe("u-thiago");
  });

  it("existe um fechamento de caixa com −R$ 37,00", () => {
    expect(banco.sessoesCaixa.some((s) => s.diferenca === -37)).toBe(true);
    expect(
      banco.eventos.some((e) => e.tipo === "caixa_diferenca" && e.valorImpacto === -37),
    ).toBe(true);
  });

  it("carne com 2,4 kg de divergência (Loja 1)", () => {
    const cont = banco.contagens.find((c) => c.lojaId === "loja-1")!;
    const carne = cont.itens.find((i) => i.insumoId === "ins-carne")!;
    expect(carne.diferenca).toBeCloseTo(-2.4);
    expect(
      banco.eventos.some((e) => e.tipo === "contagem_divergencia" && e.severidade === "critico"),
    ).toBe(true);
  });

  it("perdas de ovo acima do normal na Loja 1", () => {
    const ovoLoja = (loja: string) =>
      banco.perdas
        .filter((p) => p.insumoId === "ins-ovo" && p.lojaId === loja)
        .reduce((s, p) => s + p.qtd, 0);
    expect(ovoLoja("loja-1")).toBeGreaterThan(ovoLoja("loja-2"));
  });

  it("Loja 1 responde por ~55% do faturamento", () => {
    const fat = (loja: string) =>
      banco.pagamentos.filter((p) => p.lojaId === loja).reduce((s, p) => s + p.valor, 0);
    const l1 = fat("loja-1");
    const total = l1 + fat("loja-2");
    const share = l1 / total;
    expect(share).toBeGreaterThan(0.5);
    expect(share).toBeLessThan(0.62);
  });
});
