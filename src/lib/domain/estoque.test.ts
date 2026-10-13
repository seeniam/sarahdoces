// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Comanda, EstoqueLoja } from "@/types";
import {
  baixarEstoquePorComanda,
  calcularDivergencia,
  consumoDaComanda,
  divergenciaContagem,
} from "./estoque";
import { FICHA_POR_PRODUTO, INSUMOS } from "@/lib/mock/data";

function comandaDe(
  itens: Comanda["itens"],
  lojaId = "loja-1",
): Comanda {
  return {
    id: "t", numero: 1, lojaId, atendenteId: "u-larissa", tipo: "mesa",
    identificador: "Mesa 1", status: "enviada", itens,
    criadaEm: "2026-10-13T10:00:00.000Z",
  };
}

describe("baixarEstoquePorComanda", () => {
  it("baixa os insumos da ficha técnica na loja da comanda", () => {
    const estoque: EstoqueLoja[] = [
      { insumoId: "ins-carne", lojaId: "loja-1", qtdTeorica: 10, qtdUltimaContagem: 10, dataContagem: null },
      { insumoId: "ins-arroz", lojaId: "loja-1", qtdTeorica: 25, qtdUltimaContagem: 25, dataContagem: null },
      { insumoId: "ins-carne", lojaId: "loja-2", qtdTeorica: 10, qtdUltimaContagem: 10, dataContagem: null },
    ];
    const comanda = comandaDe([
      { produtoId: "prod-pf-carne", qtd: 1, precoUnit: 20, precoOriginal: 20, adicionais: [] },
    ]);
    const novo = baixarEstoquePorComanda(estoque, comanda, FICHA_POR_PRODUTO);

    expect(novo.find((e) => e.insumoId === "ins-carne" && e.lojaId === "loja-1")!.qtdTeorica).toBeCloseTo(9.88);
    expect(novo.find((e) => e.insumoId === "ins-arroz" && e.lojaId === "loja-1")!.qtdTeorica).toBeCloseTo(24.85);
    // Não toca na outra loja
    expect(novo.find((e) => e.insumoId === "ins-carne" && e.lojaId === "loja-2")!.qtdTeorica).toBe(10);
    // Não muta o original
    expect(estoque[0].qtdTeorica).toBe(10);
  });

  it("caso negativo: estoque zerado fica negativo (falta teórica)", () => {
    const estoque: EstoqueLoja[] = [
      { insumoId: "ins-carne", lojaId: "loja-1", qtdTeorica: 0, qtdUltimaContagem: 0, dataContagem: null },
    ];
    const comanda = comandaDe([
      { produtoId: "prod-pf-carne", qtd: 1, precoUnit: 20, precoOriginal: 20, adicionais: [] },
    ]);
    const novo = baixarEstoquePorComanda(estoque, comanda, FICHA_POR_PRODUTO);
    expect(novo[0].qtdTeorica).toBeCloseTo(-0.12);
  });
});

describe("consumoDaComanda", () => {
  it("soma a ficha e os adicionais", () => {
    const comanda = comandaDe([
      {
        produtoId: "prod-cuscuz-ovo", qtd: 1, precoUnit: 10, precoOriginal: 8,
        adicionais: [{ id: "ad-ovo", nome: "Ovo frito", preco: 2 }],
      },
    ]);
    const uso = consumoDaComanda(comanda, FICHA_POR_PRODUTO);
    // ficha cuscuz-ovo = 1 ovo; + 1 ovo do adicional = 2
    expect(uso.get("ins-ovo")).toBeCloseTo(2);
    expect(uso.get("ins-flocao")).toBeCloseTo(0.08);
  });
});

describe("calcularDivergencia / divergenciaContagem", () => {
  it("contado − teórico (negativo = falta)", () => {
    expect(calcularDivergencia({ teorico: 10, contado: 7.6 })).toBeCloseTo(-2.4);
  });

  it("totaliza a divergência em R$", () => {
    const { totalReais } = divergenciaContagem(
      [{ insumoId: "ins-carne", teorico: 10, contado: 7.6 }],
      INSUMOS,
    );
    // 2,4 kg de carne a R$ 38 = −R$ 91,20
    expect(totalReais).toBeCloseTo(-91.2, 1);
  });
});
