// @vitest-environment node
import { describe, expect, it } from "vitest";
import { calcularRendimento } from "./rendimento";

describe("calcularRendimento", () => {
  it("20 kg crus × 0,65 → 13 kg → 108 PFs de 120 g", () => {
    const r = calcularRendimento({ pesoCruKg: 20, fator: 0.65, gramasPorPorcao: 120 });
    expect(r.pesoProntoKg).toBeCloseTo(13);
    expect(r.porcoes).toBe(108);
  });

  it("gramasPorPorcao 0 não quebra", () => {
    expect(calcularRendimento({ pesoCruKg: 10, fator: 0.7, gramasPorPorcao: 0 }).porcoes).toBe(0);
  });
});
