import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type {
  BancoMock,
  Comanda,
  EventoAuditoria,
  Pagamento,
  Perda,
  SessaoCaixa,
  StatusComanda,
  UsuarioId,
} from "@/types";
import { gerarSeed, dataFortaleza, VERSAO_SEED } from "@/lib/mock/seed";
import {
  baixarEstoquePorComanda,
  estornarEstoqueDeItem,
} from "@/lib/domain/estoque";
import { perdaPorCancelamento } from "@/lib/domain/perdas";
import {
  CATEGORIAS,
  FICHAS,
  FICHA_POR_PRODUTO,
  INSUMOS,
  LOJAS,
  PRODUTOS,
  USUARIOS,
} from "@/lib/mock/data";
import { novoId } from "@/lib/id";
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
  /**
   * Cancela um item já enviado (por índice). Marca o item como cancelado e,
   * se ainda NÃO foi preparado (status "enviada"), estorna o estoque; se JÁ foi
   * ("preparando"/"pronta"), gera uma Perda automática. O status é relido do
   * estado fresco (não de um snapshot) para evitar corrida com o KDS. Se todos
   * os itens ficarem cancelados, a comanda é marcada como "cancelada".
   * Retorna o resultado para o chamador criar o EventoAuditoria/ticket só quando
   * o cancelamento realmente ocorreu. O evento é criado no PdvClient.
   */
  cancelarItemComanda: (args: {
    comandaId: string;
    itemIndex: number;
    autorizadorId: UsuarioId;
    motivo: string;
  }) => { ok: boolean; jaPreparado: boolean };
  /** Registra pagamento(s) e marca a comanda como paga. */
  registrarPagamento: (pagamentos: Pagamento[]) => void;
  /** Abre uma sessão de caixa. */
  abrirCaixa: (sessao: SessaoCaixa) => void;
  /** Acrescenta uma perda (registro manual na cozinha ou automático). */
  adicionarPerda: (perda: Perda) => void;
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
    (set, get) => ({
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
            c.id === comandaId
              ? {
                  ...c,
                  status,
                  // Carimba a conclusão para o tempo médio e o cronômetro do KDS.
                  prontaEm:
                    status === "pronta"
                      ? (c.prontaEm ?? new Date().toISOString())
                      : c.prontaEm,
                }
              : c,
          ),
        })),

      cancelarItemComanda: ({ comandaId, itemIndex, autorizadorId, motivo }) => {
        const s = get();
        const comanda = s.comandas.find((c) => c.id === comandaId);
        const item = comanda?.itens[itemIndex];
        // No-op idempotente: comanda/item inexistente ou já cancelado.
        if (!comanda || !item || item.cancelado) {
          return { ok: false, jaPreparado: false };
        }

        // Status RELIDO do estado fresco (não de um snapshot) → decisão correta
        // mesmo se o KDS avançou o status enquanto o PIN estava aberto.
        const jaPreparado = comanda.status !== "enviada";

        const itensNovos = comanda.itens.map((it, i) =>
          i !== itemIndex
            ? it
            : {
                ...it,
                cancelado: true,
                canceladoPor: autorizadorId,
                motivoCancelamento: motivo,
                canceladoEm: new Date().toISOString(),
                canceladoAposPreparo: jaPreparado,
              },
        );
        // Se todos os itens ficaram cancelados, a comanda inteira é cancelada
        // (sai do KDS e de "Comandas abertas").
        const todosCancelados = itensNovos.every((it) => it.cancelado);

        const comandas = s.comandas.map((c) =>
          c.id !== comandaId
            ? c
            : {
                ...c,
                itens: itensNovos,
                status: todosCancelados ? ("cancelada" as const) : c.status,
              },
        );

        if (!jaPreparado) {
          // Ainda não preparado: devolve os insumos ao estoque teórico.
          set({
            comandas,
            estoque: estornarEstoqueDeItem(
              s.estoque,
              comanda,
              item,
              FICHA_POR_PRODUTO,
            ),
          });
        } else {
          // Já preparado: o insumo foi gasto → vira perda automática.
          const produto = PRODUTOS.find((p) => p.id === item.produtoId);
          const perda = perdaPorCancelamento({
            id: novoId("perda"),
            lojaId: comanda.lojaId,
            produtoId: item.produtoId,
            qtd: item.qtd,
            custoUnit: produto?.custo ?? 0,
            usuarioId: autorizadorId,
            data: new Date().toISOString(),
          });
          set({ comandas, perdas: [...s.perdas, perda] });
        }
        return { ok: true, jaPreparado };
      },

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

      adicionarPerda: (perda) =>
        set((s) => ({ perdas: [...s.perdas, perda] })),

      adicionarEvento: (evento) =>
        set((s) => ({ eventos: [...s.eventos, evento] })),
    }),
    {
      name: "cereja-dados",
      // v3: ItemComanda ganhou campos de cancelamento e MotivoPerda ganhou
      // "cancelado_apos_preparo". Campos opcionais ⇒ sem migração destrutiva;
      // subir a versão descarta o cache v2 e o useHidratado regenera o seed.
      version: 3,
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
