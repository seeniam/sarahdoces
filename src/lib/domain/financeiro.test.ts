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
