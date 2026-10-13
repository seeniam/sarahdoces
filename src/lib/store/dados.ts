import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { BancoMock } from "@/types";
import { gerarSeed } from "@/lib/mock/seed";
import { sincronizarAbas } from "./sync";

export type DadosState = BancoMock & {
  /** true quando o estado persistido já foi lido do localStorage. */
  hidratado: boolean;
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
      hidratado: false,
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
    },
  ),
);

// Marca hidratação e liga a sincronização entre abas (client only).
if (typeof window !== "undefined") {
  if (useDadosStore.persist.hasHydrated()) {
    useDadosStore.setState({ hidratado: true });
  }
  useDadosStore.persist.onFinishHydration(() =>
    useDadosStore.setState({ hidratado: true }),
  );
  sincronizarAbas("cereja-dados", useDadosStore);
}
