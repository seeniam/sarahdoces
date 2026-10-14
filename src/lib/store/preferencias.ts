import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type FormaPag = "pix" | "dinheiro" | "debito" | "credito";

/** Preferências da demo por dispositivo (não são dados de negócio). */
interface PreferenciasState {
  /** Som ao "imprimir" a comanda. OFF por padrão. */
  somImpressao: boolean;
  alternarSomImpressao: () => void;
  /** Imprimir a via da cozinha ao enviar a comanda. */
  viaCozinha: boolean;
  alternarViaCozinha: () => void;
  /** Formas de pagamento aceitas nas lojas. */
  formasAceitas: Record<FormaPag, boolean>;
  alternarForma: (forma: FormaPag) => void;
}

export const usePreferenciasStore = create<PreferenciasState>()(
  persist(
    (set) => ({
      somImpressao: false,
      alternarSomImpressao: () =>
        set((s) => ({ somImpressao: !s.somImpressao })),
      viaCozinha: true,
      alternarViaCozinha: () => set((s) => ({ viaCozinha: !s.viaCozinha })),
      formasAceitas: { pix: true, dinheiro: true, debito: true, credito: true },
      alternarForma: (forma) =>
        set((s) => ({
          formasAceitas: { ...s.formasAceitas, [forma]: !s.formasAceitas[forma] },
        })),
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
