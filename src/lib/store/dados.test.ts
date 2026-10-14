// @vitest-environment node
// (jsdom trava a inicialização do worker neste ambiente; a store protege todo
// acesso a window/localStorage/BroadcastChannel, então roda puro em node.)
import { beforeEach, describe, expect, it } from "vitest";
import { useDadosStore } from "./dados";
import type { Comanda, EstoqueLoja } from "@/types";

const COMANDA: Comanda = {
  id: "c1",
  numero: 1001,
  lojaId: "loja-1",
  atendenteId: "u-larissa",
  tipo: "mesa",
  identificador: "4",
  status: "enviada",
  itens: [
    { produtoId: "prod-pf-carne", qtd: 1, precoUnit: 20, precoOriginal: 20, adicionais: [] },
  ],
  criadaEm: "2026-10-13T12:00:00.000Z",
  enviadaEm: "2026-10-13T12:00:00.000Z",
};

const ESTOQUE: EstoqueLoja[] = [
  { insumoId: "ins-carne", lojaId: "loja-1", qtdTeorica: 9.88, qtdUltimaContagem: 10, dataContagem: null },
];

beforeEach(() => {
  useDadosStore.setState({
    comandas: [structuredClone(COMANDA)],
    estoque: structuredClone(ESTOQUE),
    perdas: [],
  });
});

describe("cancelarItemComanda", () => {
  it("status enviada → estorna estoque, sem perda; retorna ok/jaPreparado=false", () => {
    const res = useDadosStore.getState().cancelarItemComanda({
      comandaId: "c1",
      itemIndex: 0,
      autorizadorId: "u-marta",
      motivo: "Cliente desistiu",
    });
    expect(res).toEqual({ ok: true, jaPreparado: false });
    const s = useDadosStore.getState();
    const item = s.comandas[0].itens[0];
    expect(item.cancelado).toBe(true);
    expect(item.canceladoPor).toBe("u-marta");
    expect(item.motivoCancelamento).toBe("Cliente desistiu");
    expect(item.canceladoAposPreparo).toBe(false);
    expect(s.perdas).toHaveLength(0);
    expect(s.estoque.find((e) => e.insumoId === "ins-carne")!.qtdTeorica).toBeCloseTo(10);
  });

  it("status preparando → cria perda automática, estoque inalterado", () => {
    const c = structuredClone(COMANDA);
    c.status = "preparando";
    useDadosStore.setState({ comandas: [c], estoque: structuredClone(ESTOQUE), perdas: [] });
    const res = useDadosStore.getState().cancelarItemComanda({
      comandaId: "c1",
      itemIndex: 0,
      autorizadorId: "u-marta",
      motivo: "Preparado errado",
    });
    expect(res).toEqual({ ok: true, jaPreparado: true });
    const s = useDadosStore.getState();
    expect(s.perdas).toHaveLength(1);
    expect(s.perdas[0].motivo).toBe("cancelado_apos_preparo");
    expect(s.perdas[0].produtoId).toBe("prod-pf-carne");
    expect(s.comandas[0].itens[0].canceladoAposPreparo).toBe(true);
    expect(s.estoque.find((e) => e.insumoId === "ins-carne")!.qtdTeorica).toBeCloseTo(9.88);
  });

  it("cancelar o único item deixa a comanda inteira cancelada", () => {
    const res = useDadosStore.getState().cancelarItemComanda({
      comandaId: "c1",
      itemIndex: 0,
      autorizadorId: "u-marta",
      motivo: "Cliente desistiu",
    });
    expect(res.ok).toBe(true);
    expect(useDadosStore.getState().comandas[0].status).toBe("cancelada");
  });

  it("item já cancelado → no-op (ok:false, não duplica perda)", () => {
    const c = structuredClone(COMANDA);
    c.itens[0].cancelado = true;
    useDadosStore.setState({ comandas: [c], perdas: [] });
    const res = useDadosStore.getState().cancelarItemComanda({
      comandaId: "c1",
      itemIndex: 0,
      autorizadorId: "u-marta",
      motivo: "x",
    });
    expect(res.ok).toBe(false);
    expect(useDadosStore.getState().perdas).toHaveLength(0);
  });

  it("comanda inexistente → no-op (ok:false)", () => {
    const res = useDadosStore.getState().cancelarItemComanda({
      comandaId: "nope",
      itemIndex: 0,
      autorizadorId: "u-marta",
      motivo: "x",
    });
    expect(res.ok).toBe(false);
    expect(useDadosStore.getState().comandas[0].itens[0].cancelado).toBeFalsy();
  });
});

describe("alterarPrecoProduto (Fase 8)", () => {
  it("altera o preço e cria evento com antes → depois", () => {
    useDadosStore.setState({
      produtos: [
        { id: "prod-cafe", nome: "Café", categoriaId: "cat-bebidas", preco: 3, custo: 0.5, ativo: true, foto: null, adicionais: [] },
      ],
      eventos: [],
    });
    useDadosStore.getState().alterarPrecoProduto({
      produtoId: "prod-cafe",
      novoPreco: 3.5,
      autorizadorId: "u-marta",
    });
    const s = useDadosStore.getState();
    expect(s.produtos.find((p) => p.id === "prod-cafe")!.preco).toBe(3.5);
    const ev = s.eventos.find((e) => e.tipo === "preco_alterado");
    expect(ev).toBeDefined();
    expect(ev!.antes).toContain("3,00");
    expect(ev!.depois).toContain("3,50");
    expect(ev!.autorizadoPor).toBe("u-marta");
  });

  it("não faz nada quando o preço não muda", () => {
    useDadosStore.setState({
      produtos: [
        { id: "prod-cafe", nome: "Café", categoriaId: "cat-bebidas", preco: 3, custo: 0.5, ativo: true, foto: null, adicionais: [] },
      ],
      eventos: [],
    });
    useDadosStore.getState().alterarPrecoProduto({ produtoId: "prod-cafe", novoPreco: 3, autorizadorId: "u-marta" });
    expect(useDadosStore.getState().eventos.length).toBe(0);
  });
});

describe("entregarEncomenda (Fase 8)", () => {
  it("marca entregue e lança o saldo como pagamento (receita)", () => {
    useDadosStore.setState({
      encomendas: [
        {
          id: "enc-x", cliente: "Vânia", whatsapp: "(98) 90000-0000",
          itens: [{ nomeLivre: "Bolo", valorUnit: 200, qtd: 1 }],
          dataEntrega: "2026-10-14T15:00:00.000Z", sinal: 100, total: 200,
          status: "pronta", lojaId: "loja-1",
        },
      ],
      pagamentos: [],
    });
    useDadosStore.getState().entregarEncomenda({ id: "enc-x", forma: "pix" });
    const s = useDadosStore.getState();
    const enc = s.encomendas.find((e) => e.id === "enc-x")!;
    expect(enc.status).toBe("entregue");
    expect(enc.formaPagamentoSaldo).toBe("pix");
    const pag = s.pagamentos.find((p) => p.comandaId === "enc-x");
    expect(pag).toBeDefined();
    expect(pag!.valor).toBe(100); // saldo = total − sinal
    expect(pag!.forma).toBe("pix");
  });
});
