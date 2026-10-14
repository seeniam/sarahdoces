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
