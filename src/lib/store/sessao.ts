import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { LojaId, UsuarioId } from "@/types";

export type LojaAtiva = LojaId | "todas";

export interface SessaoState {
  usuarioId: UsuarioId | null;
  lojaAtiva: LojaAtiva;
  entrar: (usuarioId: UsuarioId, lojaAtiva?: LojaAtiva) => void;
  sair: () => void;
  setLoja: (loja: LojaAtiva) => void;
}

const storage: StateStorage = {
  getItem: (k) => (typeof window !== "undefined" ? window.localStorage.getItem(k) : null),
  setItem: (k, v) => {
    if (typeof window !== "undefined") window.localStorage.setItem(k, v);
  },
  removeItem: (k) => {
    if (typeof window !== "undefined") window.localStorage.removeItem(k);
  },
};

export const useSessaoStore = create<SessaoState>()(
  persist(
    (set) => ({
      usuarioId: null,
      lojaAtiva: "loja-1",
      entrar: (usuarioId, lojaAtiva) =>
        set((s) => ({ usuarioId, lojaAtiva: lojaAtiva ?? s.lojaAtiva })),
      sair: () => set({ usuarioId: null }),
      setLoja: (lojaAtiva) => set({ lojaAtiva }),
    }),
    {
      name: "cereja-sessao",
      version: 1,
      storage: createJSONStorage(() => storage),
      partialize: (s) => ({ usuarioId: s.usuarioId, lojaAtiva: s.lojaAtiva }),
      // Re-hidratação pós-montagem (ver useHidratado). Evita mismatch de SSR.
      skipHydration: true,
    },
  ),
);

// A SESSÃO não sincroniza entre abas: o KDS (cozinha) e o PDV (atendente) podem
// estar logados como usuários diferentes em abas do mesmo navegador. Só os DADOS
// (comandas, estoque…) sincronizam — ver dados.ts / sync.ts.
