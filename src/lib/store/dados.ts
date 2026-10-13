import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type {
  BancoMock,
  Comanda,
  EventoAuditoria,
  Pagamento,
  SessaoCaixa,
  StatusComanda,
} from "@/types";
import { gerarSeed, dataFortaleza, VERSAO_SEED } from "@/lib/mock/seed";
import { baixarEstoquePorComanda } from "@/lib/domain/estoque";
import {
  CATEGORIAS,
  FICHAS,
  FICHA_POR_PRODUTO,
  INSUMOS,
  LOJAS,
  PRODUTOS,
  USUARIOS,
} from "@/lib/mock/data";
import { sincronizarAbas } from "./sync";

export type DadosState = BancoMock & {
  /** Data (YYYY-MM-DD, São Luís) em que o seed atual foi gerado. */
  dataAncora: string;
  /** Versão do gerador do seed (invalida o cache quando muda). */
  versaoSeed: number;
  /** Regenera o banco para "agora". */
  resetarDemo: () => void;

  // ---- Mutações de runtime (ações do usuário na demo) ----
  /** Cria a comanda (enviada à cozinha) e baixa o estoque pela ficha técnica. */
  enviarComanda: (comanda: Comanda) => void;
  /** Avança o status de uma comanda (KDS). */
  avancarStatusComanda: (comandaId: string, status: StatusComanda) => void;
  /** Registra pagamento(s) e marca a comanda como paga. */
  registrarPagamento: (pagamentos: Pagamento[]) => void;
  /** Abre uma sessão de caixa. */
  abrirCaixa: (sessao: SessaoCaixa) => void;
  /** Acrescenta um evento de auditoria. */
  adicionarEvento: (evento: EventoAuditoria) => void;
};

// Estado inicial LEVE: dados estáticos + coleções geradas vazias. O seed pesado
// (30 dias de movimento) roda só pós-montagem no useHidratado, não a cada
// carregamento de página — mantém o SSR e o 1º render rápidos e idênticos.
const BANCO_INICIAL: BancoMock = {
  lojas: LOJAS,
  usuarios: USUARIOS,
  categorias: CATEGORIAS,
  produtos: PRODUTOS,
  insumos: INSUMOS,
  fichas: FICHAS,
  estoque: [],
  comandas: [],
  pagamentos: [],
  compras: [],
  perdas: [],
  contagens: [],
  transferencias: [],
  sessoesCaixa: [],
  despesas: [],
  encomendas: [],
  eventos: [],
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
      ...BANCO_INICIAL,
      // "" nunca bate com hoje → o useHidratado gera o seed pós-montagem
      // (a menos que haja persistência válida, que sobrescreve isto).
      dataAncora: "",
      versaoSeed: VERSAO_SEED,
      resetarDemo: () => {
        const agora = new Date();
        set({
          ...gerarSeed(agora),
          dataAncora: dataFortaleza(agora),
          versaoSeed: VERSAO_SEED,
        });
      },

      enviarComanda: (comanda) =>
        set((s) => ({
          comandas: [...s.comandas, comanda],
          estoque: baixarEstoquePorComanda(s.estoque, comanda, FICHA_POR_PRODUTO),
        })),

      avancarStatusComanda: (comandaId, status) =>
        set((s) => ({
          comandas: s.comandas.map((c) =>
            c.id === comandaId ? { ...c, status } : c,
          ),
        })),

      registrarPagamento: (pagamentos) =>
        set((s) => {
          const comandaId = pagamentos[0]?.comandaId;
          const pagaEm = pagamentos[0]?.data;
          return {
            pagamentos: [...s.pagamentos, ...pagamentos],
            comandas: s.comandas.map((c) =>
              c.id === comandaId ? { ...c, status: "paga", pagaEm } : c,
            ),
          };
        }),

      abrirCaixa: (sessao) =>
        set((s) => ({ sessoesCaixa: [...s.sessoesCaixa, sessao] })),

      adicionarEvento: (evento) =>
        set((s) => ({ eventos: [...s.eventos, evento] })),
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
