// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { BancoMock, Comanda, Produto } from "@/types";
import { metricasPainel, faturamentoDeComanda, topProdutos } from "./painel";

const AGORA = new Date("2026-10-14T15:00:00-03:00");
const HOJE10 = "2026-10-14T10:00:00-03:00"; // dentro de "hoje"
const SEMANA_PASSADA = "2026-10-07T10:00:00-03:00"; // mesma quarta, mesmo horário

function prod(id: string, preco: number, custo: number): Produto {
  return { id, nome: id, categoriaId: "c", preco, custo, ativo: true, foto: null, adicionais: [] };
}

function comanda(over: Partial<Comanda> & Pick<Comanda, "id" | "itens">): Comanda {
  return {
    numero: 1,
    lojaId: "loja-1",
    atendenteId: "u-larissa",
    tipo: "mesa",
    identificador: "1",
    status: "paga",
    criadaEm: HOJE10,
    pagaEm: HOJE10,
    ...over,
  };
}

const PRODUTOS = [prod("p-pf", 20, 5), prod("p-cafe", 3, 0.5)];

function bancoDe(comandas: Comanda[], extra: Partial<BancoMock> = {}): BancoMock {
  return {
    lojas: [
      { id: "loja-1", nome: "Loja 1 — Centro", endereco: "", cor: "loja-1" },
      { id: "loja-2", nome: "Loja 2 — Cohama", endereco: "", cor: "loja-2" },
    ],
    usuarios: [],
    categorias: [],
    produtos: PRODUTOS,
    insumos: [],
    fichas: [],
    estoque: [],
    comandas,
    pagamentos: [],
    compras: [],
    perdas: [],
    contagens: [],
    transferencias: [],
    sessoesCaixa: [],
    despesas: [],
    encomendas: [],
    eventos: [],
    ...extra,
  };
}

describe("metricasPainel — 3 números conferidos independentemente", () => {
  const comandas: Comanda[] = [
    comanda({
      id: "c1",
      itens: [{ produtoId: "p-pf", qtd: 2, precoUnit: 20, precoOriginal: 20, adicionais: [] }],
    }),
    comanda({
      id: "c2",
      desconto: 1,
      itens: [{ produtoId: "p-cafe", qtd: 1, precoUnit: 3, precoOriginal: 3, adicionais: [] }],
    }),
    // Comparação: mesma quarta da semana passada, faturamento 21.
    comanda({
      id: "c0",
      criadaEm: SEMANA_PASSADA,
      pagaEm: SEMANA_PASSADA,
      itens: [{ produtoId: "p-pf", qtd: 1, precoUnit: 21, precoOriginal: 20, adicionais: [] }],
    }),
  ];
  const banco = bancoDe(comandas, {
    perdas: [
      { id: "pl", lojaId: "loja-1", qtd: 1, motivo: "queimou", custo: 8, usuarioId: "u-x", data: HOJE10 },
    ],
    despesas: [
      { id: "d", descricao: "Aluguel", categoria: "aluguel", valor: 300, vencimento: HOJE10, recorrente: true },
    ],
  });

  const m = metricasPainel(banco, "todas", "hoje", AGORA);

  it("faturamento = itens ativos − desconto (cancelados fora)", () => {
    // c1 = 40, c2 = 3 − 1 = 2 → 42 (a c0 é da semana passada, fora de hoje)
    expect(m.faturamento).toBeCloseTo(42);
    expect(m.pedidos).toBe(2);
    expect(m.ticketMedio).toBeCloseTo(21);
  });

  it("lucro estimado = faturamento − CMV − perdas − despesas (fixas/dia)", () => {
    // CMV = 2*5 + 1*0.5 = 10.5 ; perdas = 8 ; despesas = 300/30*1 = 10
    expect(m.dre.cmv).toBeCloseTo(10.5);
    expect(m.dre.perdas).toBeCloseTo(8);
    expect(m.dre.despesas).toBeCloseTo(10);
    expect(m.dre.lucro).toBeCloseTo(42 - 10.5 - 8 - 10); // 13,5
    expect(m.descontos).toBeCloseTo(1);
  });

  it("comparação justa: hoje (42) vs mesma quarta passada (21) = +100%", () => {
    expect(m.variacao.faturamento).toBeCloseTo(1); // +100%
    expect(m.rotuloComparacao).toBe("quarta passada");
  });

  it("item cancelado não entra no faturamento", () => {
    const c = comanda({
      id: "cx",
      itens: [
        { produtoId: "p-pf", qtd: 1, precoUnit: 20, precoOriginal: 20, adicionais: [] },
        { produtoId: "p-cafe", qtd: 1, precoUnit: 3, precoOriginal: 3, adicionais: [], cancelado: true },
      ],
    });
    expect(faturamentoDeComanda(c)).toBeCloseTo(20);
  });

  it("top produtos ordena por valor", () => {
    const top = topProdutos(banco, "todas", "hoje", AGORA, 5);
    expect(top[0].produto.id).toBe("p-pf");
    expect(top[0].valor).toBeCloseTo(40);
  });
});
