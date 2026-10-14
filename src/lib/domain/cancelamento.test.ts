// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Comanda, EstoqueLoja, ItemComanda } from "@/types";
import {
  baixarEstoquePorComanda,
  consumoDaComanda,
  estornarEstoqueDeItem,
} from "./estoque";
import { perdaPorCancelamento } from "./perdas";
import { FICHA_POR_PRODUTO } from "@/lib/mock/data";

function comandaDe(itens: ItemComanda[], lojaId = "loja-1"): Comanda {
  return {
    id: "t",
    numero: 1,
    lojaId,
    atendenteId: "u-larissa",
    tipo: "mesa",
    identificador: "Mesa 1",
    status: "enviada",
    itens,
    criadaEm: "2026-10-13T10:00:00.000Z",
  };
}

const PF: ItemComanda = {
  produtoId: "prod-pf-carne",
  qtd: 1,
  precoUnit: 20,
  precoOriginal: 20,
  adicionais: [],
};

describe("estornarEstoqueDeItem", () => {
  it("devolve exatamente o que a baixa consumiu do item (ida e volta = original)", () => {
    const estoque: EstoqueLoja[] = [
      { insumoId: "ins-carne", lojaId: "loja-1", qtdTeorica: 10, qtdUltimaContagem: 10, dataContagem: null },
      { insumoId: "ins-arroz", lojaId: "loja-1", qtdTeorica: 25, qtdUltimaContagem: 25, dataContagem: null },
    ];
    const comanda = comandaDe([PF]);
    const baixado = baixarEstoquePorComanda(estoque, comanda, FICHA_POR_PRODUTO);
    const estornado = estornarEstoqueDeItem(baixado, comanda, PF, FICHA_POR_PRODUTO);

    expect(estornado.find((e) => e.insumoId === "ins-carne")!.qtdTeorica).toBeCloseTo(10);
    expect(estornado.find((e) => e.insumoId === "ins-arroz")!.qtdTeorica).toBeCloseTo(25);
  });

  it("não toca em outra loja", () => {
    const estoque: EstoqueLoja[] = [
      { insumoId: "ins-carne", lojaId: "loja-2", qtdTeorica: 10, qtdUltimaContagem: 10, dataContagem: null },
    ];
    const comanda = comandaDe([PF], "loja-1");
    const estornado = estornarEstoqueDeItem(estoque, comanda, PF, FICHA_POR_PRODUTO);
    expect(estornado[0].qtdTeorica).toBe(10);
  });

  it("estorna mesmo quando o item já está marcado como cancelado", () => {
    const estoque: EstoqueLoja[] = [
      { insumoId: "ins-carne", lojaId: "loja-1", qtdTeorica: 9.88, qtdUltimaContagem: 10, dataContagem: null },
    ];
    const comanda = comandaDe([{ ...PF, cancelado: true }]);
    const estornado = estornarEstoqueDeItem(
      estoque,
      comanda,
      { ...PF, cancelado: true },
      FICHA_POR_PRODUTO,
    );
    expect(estornado[0].qtdTeorica).toBeCloseTo(10);
  });
});

describe("consumoDaComanda ignora itens cancelados", () => {
  it("item cancelado não consome insumo", () => {
    const comanda = comandaDe([{ ...PF, cancelado: true }]);
    const uso = consumoDaComanda(comanda, FICHA_POR_PRODUTO);
    expect(uso.size).toBe(0);
  });
});

describe("perdaPorCancelamento", () => {
  it("cria perda com motivo cancelado_apos_preparo e custo arredondado", () => {
    const perda = perdaPorCancelamento({
      id: "perda-1",
      lojaId: "loja-1",
      produtoId: "prod-pf-carne",
      qtd: 3,
      custoUnit: 2.333,
      usuarioId: "u-marta",
      data: "2026-10-13T12:00:00.000Z",
    });
    expect(perda.motivo).toBe("cancelado_apos_preparo");
    expect(perda.custo).toBeCloseTo(7.0, 2);
    expect(perda.produtoId).toBe("prod-pf-carne");
    expect(perda.foto).toBeNull();
  });
});
