import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { BancoMock } from "@/types";
import { gerarSeed, dataFortaleza, VERSAO_SEED } from "@/lib/mock/seed";
import { sincronizarAbas } from "./sync";

export type DadosState = BancoMock & {
  /** Data (YYYY-MM-DD, São Luís) em que o seed atual foi gerado. */
  dataAncora: string;
  /** Versão do gerador do seed (invalida o cache quando muda). */
  versaoSeed: number;
  /** Regenera o banco para "agora". */
  resetarDemo: () => void;
};

// Âncora FIXA só para o estado inicial (servidor + primeiro render do cliente),
// garantindo HTML idêntico nos dois. A re-hidratação pós-montagem (useHidratado)
// troca por "hoje" real quando a data/versão não bate (ver cacheInvalido).
const ANCORA_FIXA = new Date("2026-10-13T12:00:00-03:00");

const storage: StateStorage = {
  getItem: (k) => (typeof window !== "undefined" ? window.localStorage.getItem(k) : null),
  setItem: (k, v) => {
    if (typeof window !== "undefined") window.localStorage.setItem(k, v);
  },
  removeItem: (k) => {
    if (typeof window !== "undefined") window.localStorage.removeItem(k);
  },
};

export const useDadosStore = create<DadosState>()(
  persist(
    (set) => ({
      ...gerarSeed(ANCORA_FIXA),
      dataAncora: dataFortaleza(ANCORA_FIXA),
      versaoSeed: VERSAO_SEED,
      resetarDemo: () => {
        const agora = new Date();
        set({
          ...gerarSeed(agora),
          dataAncora: dataFortaleza(agora),
          versaoSeed: VERSAO_SEED,
        });
      },
    }),
    {
      name: "cereja-dados",
      version: 2,
      storage: createJSONStorage(() => storage),
      partialize: (s) => ({
        dataAncora: s.dataAncora,
        versaoSeed: s.versaoSeed,
        lojas: s.lojas,
        usuarios: s.usuarios,
        categorias: s.categorias,
        produtos: s.produtos,
        insumos: s.insumos,
        fichas: s.fichas,
        estoque: s.estoque,
        comandas: s.comandas,
        pagamentos: s.pagamentos,
        compras: s.compras,
        perdas: s.perdas,
        contagens: s.contagens,
        transferencias: s.transferencias,
        sessoesCaixa: s.sessoesCaixa,
        despesas: s.despesas,
        encomendas: s.encomendas,
        eventos: s.eventos,
      }),
      // Não hidratar no create() (seria síncrono, antes do render do React, e
      // causaria mismatch). A re-hidratação acontece pós-montagem no hook
      // useHidratado. Ver docs/NEXT16-NOTES.md e docs/DECISOES.md (D1.1).
      skipHydration: true,
    },
  ),
);

// Sincronização entre abas (client only).
if (typeof window !== "undefined") {
  sincronizarAbas("cereja-dados", useDadosStore);
}
