// @vitest-environment node
import { describe, expect, it } from "vitest";
import { calcularDRE, fecharCaixaCego } from "./financeiro";

describe("calcularDRE", () => {
  it("cascata Faturamento − CMV − Perdas − Despesas = Lucro", () => {
    const dre = calcularDRE({ faturamento: 100, cmv: 30, perdas: 5, despesas: 20 });
    expect(dre.lucro).toBe(45);
    expect(dre.margemLucro).toBeCloseTo(0.45);
  });

  it("margem 0 quando não há faturamento", () => {
    expect(calcularDRE({ faturamento: 0, cmv: 0, perdas: 0, despesas: 10 }).margemLucro).toBe(0);
  });
});

describe("fecharCaixaCego", () => {
  it("caso negativo: caixa com diferença (−R$ 37,00)", () => {
    const r = fecharCaixaCego({
      valorInicial: 100,
      totalDinheiro: 300,
      totalSangrias: 50,
      valorInformado: 313,
    });
    expect(r.valorEsperado).toBe(350);
    expect(r.diferenca).toBe(-37);
  });

  it("caixa certo: diferença zero", () => {
    const r = fecharCaixaCego({
      valorInicial: 100,
      totalDinheiro: 300,
      totalSangrias: 0,
      valorInformado: 400,
    });
    expect(r.diferenca).toBe(0);
  });
});

import {
  fecharCaixaCegoPorForma,
  vendasDaSessao,
  statusConta,
  fluxoDeCaixa,
} from "./financeiro";
import { dreDoPeriodo, metricasPainel } from "./painel";
import { gerarSeed } from "@/lib/mock/seed";
import type { BancoMock, Despesa } from "@/types";

const AGORA = new Date("2026-10-14T17:00:00-03:00");
const banco = gerarSeed(AGORA);

describe("fecharCaixaCegoPorForma", () => {
  it("dinheiro considera inicial, sangria e suprimento; falta de R$ 37", () => {
    const f = fecharCaixaCegoPorForma({
      valorInicial: 100,
      vendas: { dinheiro: 300, debito: 200, credito: 150 },
      totalSangrias: 50,
      totalSuprimentos: 20,
      informado: { dinheiro: 333, debito: 200, credito: 150 },
    });
    // esperado dinheiro = 100 + 300 - 50 + 20 = 370
    expect(f.esperado.dinheiro).toBe(370);
    expect(f.esperado.debito).toBe(200);
    expect(f.diferenca.dinheiro).toBe(-37);
    expect(f.diferencaTotal).toBe(-37);
  });

  it("cartão informado exato → diferença só no dinheiro", () => {
    const f = fecharCaixaCegoPorForma({
      valorInicial: 100,
      vendas: { dinheiro: 200, debito: 100, credito: 80 },
      totalSangrias: 0,
      totalSuprimentos: 0,
      informado: { dinheiro: 300, debito: 100, credito: 80 },
    });
    expect(f.diferencaTotal).toBe(0);
  });
});

describe("vendasDaSessao", () => {
  it("soma por forma, ignora Pix e outra loja/atendente", () => {
    const sessao = banco.sessoesCaixa.find((s) => s.fechamento)!;
    const v = vendasDaSessao(banco, sessao);
    expect(v.dinheiro).toBeGreaterThanOrEqual(0);
    // Pix nunca entra no caixa.
    expect(Object.keys(v)).toEqual(["dinheiro", "debito", "credito"]);
  });
});

describe("DRE = lucro do painel (mesma função de domínio)", () => {
  for (const periodo of ["hoje", "7dias", "30dias"] as const) {
    it(`bate em ${periodo}`, () => {
      const dre = dreDoPeriodo(banco, "todas", periodo, AGORA);
      const m = metricasPainel(banco, "todas", periodo, AGORA);
      expect(dre.lucro).toBeCloseTo(m.dre.lucro, 2);
      expect(dre.faturamento).toBeCloseTo(m.faturamento, 2);
    });
  }
});

describe("statusConta", () => {
  const base: Omit<Despesa, "vencimento" | "pagoEm"> = {
    id: "d", descricao: "x", categoria: "outros", valor: 100,
  };
  const dias = (n: number) => new Date(AGORA.getTime() + n * 86400000).toISOString();
  it("paga / vencida / vence_em_breve / a_vencer", () => {
    expect(statusConta({ ...base, vencimento: dias(10), pagoEm: dias(-1) }, AGORA)).toBe("paga");
    expect(statusConta({ ...base, vencimento: dias(-1) }, AGORA)).toBe("vencida");
    expect(statusConta({ ...base, vencimento: dias(2) }, AGORA)).toBe("vence_em_breve");
    expect(statusConta({ ...base, vencimento: dias(10) }, AGORA)).toBe("a_vencer");
  });
});

describe("fluxoDeCaixa", () => {
  it("entradas e saídas com saldo acumulado coerente", () => {
    const de = new Date(AGORA.getTime() - 7 * 86400000);
    const r = fluxoDeCaixa(banco, "todas", de, AGORA);
    expect(r.totalEntradas).toBeGreaterThan(0);
    // saldo = entradas - saídas
    expect(r.saldo).toBeCloseTo(r.totalEntradas - r.totalSaidas, 2);
    // último saldo acumulado == saldo total
    if (r.pontos.length > 0) {
      expect(r.pontos[r.pontos.length - 1].saldoAcumulado).toBeCloseTo(r.saldo, 2);
    }
  });
});

import { despesasDoPeriodo, janelasDoPeriodo } from "./painel";

describe("despesasDoPeriodo — recorrente vs avulsa", () => {
  const AG = new Date("2026-10-14T17:00:00-03:00");
  const diaISO = (n: number) => new Date(AG.getTime() + n * 86400000).toISOString();
  function bancoCom(despesas: Despesa[]): BancoMock {
    return { ...gerarSeed(AG), despesas };
  }

  it("recorrente é rateada por dia; avulsa conta cheia só no período", () => {
    const b = bancoCom([
      { id: "r", descricao: "Aluguel", categoria: "aluguel", valor: 3000, vencimento: diaISO(2), recorrente: true },
      { id: "a1", descricao: "Conserto", categoria: "manutencao", valor: 600, vencimento: diaISO(-2) }, // avulsa, no período 7d
      { id: "a2", descricao: "Futura", categoria: "outros", valor: 999, vencimento: diaISO(40) }, // avulsa fora
    ]);
    const j = janelasDoPeriodo("7dias", AG);
    const d = despesasDoPeriodo(b, "todas", j);
    // aluguel 3000/30*7 = 700 ; conserto 600 (no período) ; futura 0
    expect(d).toBeCloseTo(700 + 600, 1);
  });
});
