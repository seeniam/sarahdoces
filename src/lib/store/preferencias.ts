import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Preferências da demo por dispositivo (não são dados de negócio). */
interface PreferenciasState {
  /** Som ao "imprimir" a comanda. OFF por padrão. */
  somImpressao: boolean;
  alternarSomImpressao: () => void;
}

export const usePreferenciasStore = create<PreferenciasState>()(
  persist(
    (set) => ({
      somImpressao: false,
      alternarSomImpressao: () =>
        set((s) => ({ somImpressao: !s.somImpressao })),
    }),
    {
      name: "cereja-preferencias",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : // Fallback no-op no servidor (sem acesso a localStorage).
            {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
    },
  ),
);
