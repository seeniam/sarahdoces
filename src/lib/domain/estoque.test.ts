// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Comanda, EstoqueLoja } from "@/types";
import {
  baixarEstoquePorComanda,
  balancoInsumo,
  calcularDivergencia,
  construirMovimentacoes,
  consumoDaComanda,
  custoMedioPonderado,
  divergenciaContagem,
  estoqueTeorico,
  statusEstoque,
} from "./estoque";
import { alertasPainel } from "./painel";
import { gerarSeed } from "@/lib/mock/seed";
import { FICHA_POR_PRODUTO, INSUMOS } from "@/lib/mock/data";

// Data fixa → seed 100% determinístico (ancoragem + idades do KDS).
const AGORA = new Date("2026-10-14T17:00:00-03:00");
const banco = gerarSeed(AGORA);

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

describe("statusEstoque", () => {
  it("classifica em ok / baixo / crítico", () => {
    expect(statusEstoque(20, 10)).toBe("ok");
    expect(statusEstoque(8, 10)).toBe("baixo");
    expect(statusEstoque(4, 10)).toBe("critico");
    expect(statusEstoque(0, 10)).toBe("critico");
  });
});

describe("custoMedioPonderado", () => {
  it("pondera estoque atual e compra nova", () => {
    // 10 kg a R$ 38 + 10 kg a R$ 42 → R$ 40
    expect(
      custoMedioPonderado({ qtdAtual: 10, custoAtual: 38, qtdCompra: 10, custoUnitCompra: 42 }),
    ).toBeCloseTo(40);
  });
  it("estoque negativo não credita custo (vale o da compra)", () => {
    expect(
      custoMedioPonderado({ qtdAtual: -5, custoAtual: 38, qtdCompra: 8, custoUnitCompra: 45 }),
    ).toBeCloseTo(45);
  });
});

describe("movimentações = estoque teórico", () => {
  it("a soma das movimentações reconcilia com o teórico gravado (todos os pares)", () => {
    for (const e of banco.estoque) {
      const teorico = estoqueTeorico(
        banco,
        e.insumoId,
        e.lojaId,
        FICHA_POR_PRODUTO,
        AGORA,
      );
      expect(teorico).toBeCloseTo(e.qtdTeorica, 2);
    }
  });

  it("insumo sem movimentação tem saldo inicial ancorado no banco (determinístico), não no relógio", () => {
    // ins-macarrao não tem ficha/compra/perda → só o saldo inicial. A data do
    // saldo deve ficar ~no início do banco (meses atrás), nunca "agora".
    const movs = construirMovimentacoes(banco, "ins-macarrao", "loja-1", FICHA_POR_PRODUTO);
    const saldo = movs.find((m) => m.tipo === "saldo_inicial")!;
    expect(new Date(saldo.data).getTime()).toBeLessThan(AGORA.getTime() - 20 * 24 * 3600 * 1000);
    // E o teórico num instante ANTES de agora (mas depois do saldo) reconcilia.
    const ontem = new Date(AGORA.getTime() - 24 * 3600 * 1000);
    const teorico = estoqueTeorico(banco, "ins-macarrao", "loja-1", FICHA_POR_PRODUTO, ontem);
    const gravado = banco.estoque.find(
      (e) => e.insumoId === "ins-macarrao" && e.lojaId === "loja-1",
    )!.qtdTeorica;
    expect(teorico).toBeCloseTo(gravado, 2);
  });

  it("o extrato da carne (Loja 1) traz saldo inicial, compras, consumo e contagem", () => {
    const movs = construirMovimentacoes(banco, "ins-carne", "loja-1", FICHA_POR_PRODUTO);
    const tipos = new Set(movs.map((m) => m.tipo));
    expect(tipos.has("saldo_inicial")).toBe(true);
    expect(tipos.has("compra")).toBe(true);
    expect(tipos.has("consumo")).toBe(true);
    expect(tipos.has("ajuste_contagem")).toBe(true);
    // Ordenado por data, saldo inicial primeiro.
    expect(movs[0].tipo).toBe("saldo_inicial");
  });
});

describe("balancoInsumo — Para onde foi a carne?", () => {
  it("a carne (Loja 1) tem 2,4 kg sem explicação", () => {
    const b = balancoInsumo(banco, "ins-carne", "loja-1", FICHA_POR_PRODUTO, {
      dias: 7,
      agora: AGORA,
    });
    expect(b.semExplicacao).toBeCloseTo(2.4, 2);
    expect(b.comprado).toBeGreaterThan(0);
    expect(b.vendido).toBeGreaterThan(0);
  });

  it("o número bate com o alerta do painel (mesma falta)", () => {
    const b = balancoInsumo(banco, "ins-carne", "loja-1", FICHA_POR_PRODUTO, {
      dias: 7,
      agora: AGORA,
    });
    const alertas = alertasPainel(banco, "todas", AGORA);
    const divergencia = alertas.find((a) => a.id.startsWith("divergencia"));
    expect(divergencia).toBeDefined();
    // O painel mostra o valor em R$: 2,4 kg × R$ 38 = R$ 91,20.
    const custo = b.semExplicacao * b.custoMedio;
    expect(custo).toBeCloseTo(91.2, 1);
    expect(divergencia!.texto).toContain("91,20");
  });
});
