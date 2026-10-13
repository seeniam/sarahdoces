import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { BancoMock } from "@/types";
import { gerarSeed } from "@/lib/mock/seed";
import { sincronizarAbas } from "./sync";

export type DadosState = BancoMock & {
  /** Restaura o banco mock ao seed determinístico. */
  resetarDemo: () => void;
};

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
      ...gerarSeed(),
      resetarDemo: () => set({ ...gerarSeed() }),
    }),
    {
      name: "cereja-dados",
      version: 1,
      storage: createJSONStorage(() => storage),
      // Persistir só os dados (não as funções nem a flag).
      partialize: (s): BancoMock => ({
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
      // useHidratado. Ver docs/NEXT16-NOTES.md.
      skipHydration: true,
    },
  ),
);

// Sincronização entre abas (client only).
if (typeof window !== "undefined") {
  sincronizarAbas("cereja-dados", useDadosStore);
}
