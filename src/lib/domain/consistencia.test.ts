// @vitest-environment node
//
// Revisão de consistência (antes da Fase 9): "nenhum número pode se contradizer
// na frente da cliente". Três garantias:
//   1. Perdas — painel (card) e DRE derivam da MESMA definição (perdasNoPeriodo).
//   2. Pontos de atenção × alerta do painel — o número do alerta vem do mesmo
//      cálculo, apenas em janela diferente (7 dias vs 30 dias), e ambas explícitas.
//   3. "Para onde foi?" — a soma dos segmentos é sempre igual ao total exibido.
import { describe, expect, it } from "vitest";
import {
  dreDoPeriodo,
  vendaXPerda,
  perdasNoPeriodo,
  alertasPainel,
  janelasDoPeriodo,
  pontosDeAtencao,
  balancoInsumo,
  segmentosBalanco,
} from ".";
import type { LojaFiltro } from ".";
import { gerarSeed } from "@/lib/mock/seed";
import { FICHA_POR_PRODUTO, INSUMOS } from "@/lib/mock/data";

const AGORA = new Date("2026-10-14T17:00:00-03:00");
const banco = gerarSeed(AGORA);
const DIA_MS = 86_400_000;
const FILTROS: LojaFiltro[] = ["todas", "loja-1", "loja-2"];

// ---------------------------------------------------------------------------
// 1) Perdas: card do painel (soma do vendaXPerda) e DRE usam a MESMA definição.
// ---------------------------------------------------------------------------
describe("perdas — mesma definição alimenta painel e DRE", () => {
  it.each(FILTROS)("DRE usa perdasNoPeriodo (%s)", (filtro) => {
    const j = janelasDoPeriodo("30dias", AGORA);
    const viaDre = dreDoPeriodo(banco, filtro, "30dias", AGORA).perdas;
    const viaFonte = perdasNoPeriodo(banco, filtro, j.atual.inicio, j.atual.fim);
    expect(viaDre).toBeCloseTo(viaFonte, 6);
  });

  it.each(FILTROS)("card do painel (14 dias) = perdasNoPeriodo na mesma janela (%s)", (filtro) => {
    const vxp = vendaXPerda(banco, filtro, AGORA, 14);
    const somaCard = vxp.reduce((s, p) => s + p.perda, 0);
    // Janela exata do vendaXPerda: do início do 1º dia exibido até agora.
    const deMs = new Date(`${vxp[0]!.dia}T00:00:00-03:00`).getTime();
    const viaFonte = perdasNoPeriodo(banco, filtro, deMs, AGORA.getTime());
    expect(somaCard).toBeCloseTo(viaFonte, 6);
  });

  it("os dois cards descrevem janelas diferentes (14d ≠ 30d) — por isso são rotulados", () => {
    const perda14 = vendaXPerda(banco, "todas", AGORA, 14).reduce((s, p) => s + p.perda, 0);
    const perda30 = dreDoPeriodo(banco, "todas", "30dias", AGORA).perdas;
    // Mesma definição, janelas distintas ⇒ números distintos, nunca contraditórios.
    expect(perda30).toBeGreaterThan(perda14);
  });
});

// ---------------------------------------------------------------------------
// 2) Alerta do painel × pontos de atenção: mesmo cálculo, janelas explícitas.
// ---------------------------------------------------------------------------
describe("cancelamentos — alerta (7 dias) e pontos de atenção (30 dias)", () => {
  const contaCancel = (usuarioId: string, dias: number) =>
    banco.eventos.filter(
      (e) =>
        e.usuarioId === usuarioId &&
        e.tipo === "cancelamento" &&
        new Date(e.data).getTime() >= AGORA.getTime() - dias * DIA_MS,
    ).length;

  it("o número do alerta é exatamente a contagem de 7 dias (mesmo cálculo)", () => {
    const alerta = alertasPainel(banco, "todas", AGORA).find((a) => a.id === "risco-cancelamento");
    expect(alerta).toBeDefined();
    const noAlerta = Number(alerta!.texto.match(/cancelou (\d+) ite/)![1]);
    expect(noAlerta).toBe(contaCancel("u-thiago", 7));
    expect(alerta!.texto).toContain("esta semana"); // janela explícita
  });

  it("pontos de atenção usam a janela de 30 dias, rotulada explicitamente", () => {
    const de = new Date(AGORA.getTime() - 30 * DIA_MS);
    const thiago = pontosDeAtencao(banco, de, AGORA).find((p) => p.nome === "Thiago");
    expect(thiago).toBeDefined();
    expect(thiago!.cancelamentos).toBe(contaCancel("u-thiago", 30));
    expect(thiago!.observacoes.join(" ")).toContain("nos últimos 30 dias");
  });

  it("a anomalia do Thiago é realista (~3× a média da equipe, não um exagero)", () => {
    const de = new Date(AGORA.getTime() - 30 * DIA_MS);
    const pontos = pontosDeAtencao(banco, de, AGORA);
    const thiago = pontos.find((p) => p.nome === "Thiago")!;
    const outros = pontos.filter((p) => p.nome !== "Thiago");
    const mediaOutros = outros.reduce((s, p) => s + p.cancelamentos, 0) / outros.length;
    const razao = thiago.cancelamentos / mediaOutros;
    expect(razao).toBeGreaterThanOrEqual(2); // acima da média
    expect(razao).toBeLessThanOrEqual(4); // mas plausível (não 10×)
    expect(mediaOutros).toBeGreaterThan(3); // média da equipe plausível (não ~0)
  });
});

// ---------------------------------------------------------------------------
// 3) "Para onde foi?": a soma dos segmentos é sempre o total exibido.
// ---------------------------------------------------------------------------
describe("balanço de insumo — segmentos sempre somam o total", () => {
  const lojas = ["loja-1", "loja-2"] as const;
  for (const insumo of INSUMOS) {
    for (const loja of lojas) {
      it(`${insumo.nome} em ${loja}: Σ segmentos = total e total = fontes`, () => {
        const bal = balancoInsumo(banco, insumo.id, loja, FICHA_POR_PRODUTO, {
          dias: 7,
          agora: AGORA,
        });
        const seg = segmentosBalanco(bal, 1);
        const somaDestinos =
          seg.vendido + seg.perdido + seg.transferenciaSaida + seg.emEstoque + seg.semExplicacao;
        // Soma dos valores EXIBIDOS = total EXIBIDO (nunca 45,6 para um total de 45).
        expect(somaDestinos).toBeCloseTo(seg.total, 10);
        // "Tínhamos X" = estoque inicial + comprado + transferido para dentro.
        const somaFontes = seg.estoqueInicio + seg.comprado + seg.transferenciaEntrada;
        expect(somaFontes).toBeCloseTo(seg.total, 10);
      });
    }
  }
});
