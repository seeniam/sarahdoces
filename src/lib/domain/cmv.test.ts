// @vitest-environment node
import { describe, expect, it } from "vitest";
import { calcularCMV, margem } from "./cmv";
import { FICHA_POR_PRODUTO, INSUMOS, PRODUTOS } from "@/lib/mock/data";

describe("calcularCMV", () => {
  it("soma qtd × custoMedio dos insumos da ficha (brigadeiro)", () => {
    const ficha = FICHA_POR_PRODUTO.get("prod-brigadeiro");
    // leite-cond 0,15×7 + choco 0,01×24 + granulado 0,005×20 = 1,05 + 0,24 + 0,10
    expect(calcularCMV(ficha, INSUMOS)).toBeCloseTo(1.39, 2);
  });

  it("sem ficha → custo 0", () => {
    expect(calcularCMV(undefined, INSUMOS)).toBe(0);
  });

  it("todo produto tem custo ≥ 0 e margem positiva", () => {
    for (const p of PRODUTOS) {
      expect(p.custo).toBeGreaterThanOrEqual(0);
      expect(p.custo).toBeLessThan(p.preco);
      expect(margem(p.preco, p.custo)).toBeGreaterThan(0);
    }
  });
});
