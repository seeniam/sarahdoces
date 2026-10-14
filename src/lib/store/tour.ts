import { create } from "zustand";
import type { Route } from "next";

/**
 * Modo Apresentação — tour guiado para a Sarah (ou para quem apresenta a ela).
 * Cobre os 4 fluxos do PRD §6, com dados preparados em cada passo (não depende
 * do acaso do seed). O overlay (TourOverlay) lê os passos daqui, navega até a
 * rota certa, destaca o elemento `[data-tour]` e narra em linguagem simples.
 *
 * Cooperação com as telas: alguns passos precisam que a TELA faça algo (montar
 * a comanda no PDV, enviar, abrir o desconto). Isso é feito por um "barramento
 * de sinais": o overlay emite um sinal, a tela escuta (ver usePdvTour).
 */

export type FluxoId = "i" | "ii" | "iii" | "iv";

export interface PassoTour {
  id: string;
  fluxo: FluxoId;
  /** Rótulo curto do fluxo (para o progresso). */
  rotuloFluxo: string;
  rota: Route;
  /** Seletor do elemento a destacar (ex.: '[data-tour="pdv-enviar"]'). */
  alvo?: string;
  titulo: string;
  /** 1–2 frases na linguagem da Sarah (nada técnico). */
  texto: string;
  /** Sinal emitido ao ENTRAR no passo (preparar a tela). */
  aoEntrar?: string;
  /** Sinal emitido ao clicar em "Próximo" (antes de avançar). */
  aoAvancar?: string;
  /** Espera (ms) após `aoAvancar` antes de avançar (deixa a animação rodar). */
  esperaAposAvancar?: number;
  /** Lado preferido do balão em relação ao alvo. */
  lado?: "auto" | "centro";
}

export const PASSOS: PassoTour[] = [
  // ---- Fluxo i — Pedido sem sair do caixa -------------------------------
  {
    id: "i-montar",
    fluxo: "i",
    rotuloFluxo: "Pedido no caixa",
    rota: "/pdv",
    alvo: '[data-tour="pdv-enviar"]',
    titulo: "Todo pedido vira comanda",
    texto:
      "A atendente toca nos produtos e manda para a cozinha. Sem comanda, nada sai — então nada escapa do controle.",
    aoEntrar: "pdv:montar",
    aoAvancar: "pdv:enviar",
    esperaAposAvancar: 850,
  },
  {
    id: "i-impressa",
    fluxo: "i",
    rotuloFluxo: "Pedido no caixa",
    rota: "/pdv",
    alvo: '[data-tour="ticket-impresso"]',
    titulo: "Saiu impressa na hora",
    texto:
      "A comanda cai na cozinha no mesmo instante. Acabou o papelzinho perdido e o grito de pedido.",
    aoAvancar: "pdv:fechar-impressao",
    lado: "centro",
  },
  // ---- Fluxo ii — Desconto exige autorização ----------------------------
  {
    id: "ii-desconto",
    fluxo: "ii",
    rotuloFluxo: "Desconto com PIN",
    rota: "/pdv",
    titulo: "Desconto só com o gerente",
    texto:
      "Baixar o preço exige o PIN de quem pode autorizar. Ninguém dá desconto escondido no seu caixa.",
    aoEntrar: "pdv:abrir-desconto",
    lado: "centro",
  },
  {
    id: "ii-auditoria",
    fluxo: "ii",
    rotuloFluxo: "Desconto com PIN",
    rota: "/auditoria",
    alvo: '[data-tour="auditoria-lista"]',
    titulo: "E fica registrado",
    texto:
      "Todo desconto, cortesia ou cancelamento aparece aqui: quem pediu, quem liberou e quanto. Você vê do celular.",
    aoEntrar: "tour:fechar-desconto",
  },
  // ---- Fluxo iii — A carne que some -------------------------------------
  {
    id: "iii-carne",
    fluxo: "iii",
    rotuloFluxo: "A carne que some",
    rota: "/perdas",
    alvo: '[data-tour="carne-sem-explicacao"]',
    titulo: "Para onde foi a carne?",
    texto:
      "Comprado menos vendido, perdas e o que sobrou: faltam 2,4 kg sem explicação — R$ 91,20 que sumiram sem ninguém anotar.",
  },
  // ---- Fluxo iv — Fechamento de caixa cego ------------------------------
  {
    id: "iv-painel",
    fluxo: "iv",
    rotuloFluxo: "Caixa que não fecha",
    rota: "/painel",
    alvo: '[data-tour="alerta-caixa"]',
    titulo: "A gaveta não bateu",
    texto:
      "No fim do dia, a atendente informa quanto tem na gaveta sem ver o esperado. Deu R$ 37,00 a menos — e o alerta chega aqui, no seu painel.",
  },
];

interface TourState {
  ativo: boolean;
  indice: number;
  /** Barramento de sinais overlay → telas. `n` sobe a cada emissão. */
  sinal: { nome: string; n: number };
  iniciar: () => void;
  irPara: (indice: number) => void;
  proximo: () => void;
  voltar: () => void;
  encerrar: () => void;
  emitir: (nome: string) => void;
}

export const TOTAL_PASSOS = PASSOS.length;

export const useTourStore = create<TourState>()((set, get) => ({
  ativo: false,
  indice: 0,
  sinal: { nome: "", n: 0 },
  iniciar: () => set({ ativo: true, indice: 0 }),
  irPara: (indice) =>
    set({ indice: Math.max(0, Math.min(TOTAL_PASSOS - 1, indice)) }),
  proximo: () => {
    const { indice } = get();
    if (indice >= TOTAL_PASSOS - 1) {
      set({ ativo: false, indice: 0 });
      return;
    }
    set({ indice: indice + 1 });
  },
  voltar: () => set((s) => ({ indice: Math.max(0, s.indice - 1) })),
  encerrar: () => set({ ativo: false, indice: 0 }),
  emitir: (nome) => set((s) => ({ sinal: { nome, n: s.sinal.n + 1 } })),
}));
