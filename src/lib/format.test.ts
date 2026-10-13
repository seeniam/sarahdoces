// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  formatBRL,
  formatBRLSinalado,
  formatPorcentagem,
  formatQuantidade,
} from "./format";

// Normaliza espaços unicode (U+00A0 / U+202F variam conforme o ICU).
const n = (s: string) => s.replace(/[  ]/g, " ");

describe("format", () => {
  it("formata moeda em pt-BR", () => {
    expect(n(formatBRL(4812.5))).toBe("R$ 4.812,50");
    expect(n(formatBRL(3))).toBe("R$ 3,00");
  });

  it("usa o sinal de menos tipográfico em diferenças negativas", () => {
    expect(n(formatBRLSinalado(-37))).toBe("−R$ 37,00");
    expect(n(formatBRLSinalado(12))).toBe("+R$ 12,00");
  });

  it("formata porcentagem", () => {
    expect(formatPorcentagem(0.124)).toBe("12,4%");
  });

  it("formata quantidade com unidade", () => {
    expect(formatQuantidade(2.4, "kg")).toBe("2,4 kg");
    expect(formatQuantidade(13, "un")).toBe("13 un");
  });
});
