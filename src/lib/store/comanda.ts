import { create } from "zustand";
import type { Adicional, ItemComanda, Produto, TipoComanda } from "@/types";

export interface ComandaAtualState {
  tipo: TipoComanda;
  identificador: string;
  itens: ItemComanda[];
  desconto: number;
  cortesia: boolean;
  motivoDesconto?: string;

  setTipo: (tipo: TipoComanda) => void;
  setIdentificador: (v: string) => void;
  adicionar: (produto: Produto) => void;
  incluir: (index: number) => void;
  reduzir: (index: number) => void;
  remover: (index: number) => void;
  atualizarItem: (
    index: number,
    dados: { adicionais?: Adicional[]; obs?: string },
  ) => void;
  aplicarDesconto: (valor: number, cortesia: boolean, motivo?: string) => void;
  limpar: () => void;
}

const INICIAL = {
  tipo: "mesa" as TipoComanda,
  identificador: "",
  itens: [] as ItemComanda[],
  desconto: 0,
  cortesia: false,
  motivoDesconto: undefined as string | undefined,
};

function precoComAdicionais(precoOriginal: number, adicionais: Adicional[]) {
  return precoOriginal + adicionais.reduce((s, a) => s + a.preco, 0);
}

export const useComandaStore = create<ComandaAtualState>()((set) => ({
  ...INICIAL,

  setTipo: (tipo) => set({ tipo }),
  setIdentificador: (identificador) => set({ identificador }),

  adicionar: (produto) =>
    set((s) => {
      // Mescla com uma linha igual (mesmo produto, sem adicionais nem observação).
      const i = s.itens.findIndex(
        (it) =>
          it.produtoId === produto.id &&
          it.adicionais.length === 0 &&
          !it.obs,
      );
      if (i >= 0) {
        const itens = [...s.itens];
        itens[i] = { ...itens[i], qtd: itens[i].qtd + 1 };
        return { itens };
      }
      const novo: ItemComanda = {
        produtoId: produto.id,
        qtd: 1,
        precoUnit: produto.preco,
        precoOriginal: produto.preco,
        adicionais: [],
      };
      return { itens: [...s.itens, novo] };
    }),

  incluir: (index) =>
    set((s) => {
      const itens = [...s.itens];
      itens[index] = { ...itens[index], qtd: itens[index].qtd + 1 };
      return { itens };
    }),

  reduzir: (index) =>
    set((s) => {
      const itens = [...s.itens];
      const q = itens[index].qtd - 1;
      if (q <= 0) return { itens: itens.filter((_, i) => i !== index) };
      itens[index] = { ...itens[index], qtd: q };
      return { itens };
    }),

  remover: (index) =>
    set((s) => ({ itens: s.itens.filter((_, i) => i !== index) })),

  atualizarItem: (index, dados) =>
    set((s) => {
      const itens = [...s.itens];
      const atual = itens[index];
      const adicionais = dados.adicionais ?? atual.adicionais;
      itens[index] = {
        ...atual,
        adicionais,
        obs: "obs" in dados ? dados.obs : atual.obs,
        precoUnit: precoComAdicionais(atual.precoOriginal, adicionais),
      };
      return { itens };
    }),

  aplicarDesconto: (valor, cortesia, motivo) =>
    set({ desconto: valor, cortesia, motivoDesconto: motivo }),

  limpar: () => set({ ...INICIAL }),
}));
