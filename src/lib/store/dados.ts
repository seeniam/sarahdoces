import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type {
  BancoMock,
  Comanda,
  Compra,
  Contagem,
  EventoAuditoria,
  ItemContagem,
  LojaId,
  Pagamento,
  Perda,
  SessaoCaixa,
  StatusComanda,
  Transferencia,
  UsuarioId,
} from "@/types";
import { gerarSeed, dataFortaleza, VERSAO_SEED } from "@/lib/mock/seed";
import {
  baixarEstoquePorComanda,
  custoMedioPonderado,
  estornarEstoqueDeItem,
} from "@/lib/domain/estoque";
import { perdaPorCancelamento } from "@/lib/domain/perdas";
import { registrarEvento } from "@/lib/domain/auditoria";
import {
  CATEGORIAS,
  FICHAS,
  FICHA_POR_PRODUTO,
  INSUMOS,
  LOJAS,
  PRODUTOS,
  USUARIOS,
} from "@/lib/mock/data";
import { novoId, agoraISO } from "@/lib/id";
import { formatQuantidade } from "@/lib/format";
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
  /** Marca a comanda como entregue na cozinha (sai do KDS). */
  marcarEntregueComanda: (comandaId: string) => void;
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

  // ---- Estoque (Fase 6) ----
  /**
   * Registra uma compra: entra no estoque teórico, atualiza o custo médio
   * ponderado do insumo e lança a saída no financeiro (despesa paga).
   */
  registrarCompra: (compra: Compra) => void;
  /**
   * Registra uma contagem física (cega). O teórico de cada item é lido do
   * estado no momento; a divergência (contado − teórico) é calculada aqui. A
   * contagem NÃO sobrescreve o teórico — expõe a divergência. Gera evento de
   * auditoria para divergências relevantes (> 3% ou > R$ 20). Retorna o
   * resultado para a tela mostrar o resumo.
   */
  registrarContagem: (args: {
    lojaId: LojaId;
    usuarioId: UsuarioId;
    contagens: { insumoId: string; contado: number }[];
  }) => { contagem: Contagem; totalReais: number; relevantes: ItemContagem[] };
  /** Transfere insumos entre lojas: saída numa, entrada na outra. */
  registrarTransferencia: (transferencia: Transferencia) => void;
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

      marcarEntregueComanda: (comandaId) =>
        set((s) => ({
          comandas: s.comandas.map((c) =>
            c.id === comandaId
              ? { ...c, entregueEm: c.entregueEm ?? new Date().toISOString() }
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
        set((s) => ({
          perdas: [...s.perdas, perda],
          // Perda de insumo baixa o estoque teórico (produto já foi consumido).
          estoque: perda.insumoId
            ? s.estoque.map((e) =>
                e.insumoId === perda.insumoId && e.lojaId === perda.lojaId
                  ? { ...e, qtdTeorica: Number((e.qtdTeorica - perda.qtd).toFixed(4)) }
                  : e,
              )
            : s.estoque,
        })),

      adicionarEvento: (evento) =>
        set((s) => ({ eventos: [...s.eventos, evento] })),

      registrarCompra: (compra) =>
        set((s) => {
          // Entra no estoque e recalcula o custo médio por insumo.
          const estoque = s.estoque.map((e) => ({ ...e }));
          const insumos = s.insumos.map((i) => ({ ...i }));
          for (const item of compra.itens) {
            if (item.qtd <= 0) continue;
            const linha = estoque.find(
              (e) => e.insumoId === item.insumoId && e.lojaId === compra.lojaId,
            );
            const insumo = insumos.find((i) => i.id === item.insumoId);
            const custoUnit = item.valor / item.qtd;
            if (insumo) {
              // custoMedio é global (por insumo), então pondera com o estoque
              // de TODAS as lojas — senão uma compra numa loja distorceria o
              // valor em R$ mostrado para a outra.
              const qtdAtualTotal = estoque
                .filter((e) => e.insumoId === item.insumoId)
                .reduce((soma, e) => soma + e.qtdTeorica, 0);
              insumo.custoMedio = Number(
                custoMedioPonderado({
                  qtdAtual: qtdAtualTotal,
                  custoAtual: insumo.custoMedio,
                  qtdCompra: item.qtd,
                  custoUnitCompra: custoUnit,
                }).toFixed(4),
              );
            }
            if (linha) {
              linha.qtdTeorica = Number((linha.qtdTeorica + item.qtd).toFixed(4));
            } else {
              estoque.push({
                insumoId: item.insumoId,
                lojaId: compra.lojaId,
                qtdTeorica: item.qtd,
                qtdUltimaContagem: 0,
                dataContagem: null,
              });
            }
          }
          // Saída no financeiro: despesa paga no ato.
          const despesa = {
            id: novoId("desp"),
            lojaId: compra.lojaId,
            descricao: `Compra · ${compra.fornecedor}`,
            categoria: "outros" as const,
            valor: compra.total,
            vencimento: compra.data,
            pagoEm: compra.data,
          };
          return {
            compras: [...s.compras, compra],
            estoque,
            insumos,
            despesas: [...s.despesas, despesa],
          };
        }),

      registrarContagem: ({ lojaId, usuarioId, contagens }) => {
        const s = get();
        const custoPorInsumo = new Map(s.insumos.map((i) => [i.id, i.custoMedio]));
        const teoricoPorInsumo = new Map(
          s.estoque
            .filter((e) => e.lojaId === lojaId)
            .map((e) => [e.insumoId, e.qtdTeorica]),
        );
        const itens: ItemContagem[] = contagens.map(({ insumoId, contado }) => {
          const teorico = Number((teoricoPorInsumo.get(insumoId) ?? 0).toFixed(3));
          return {
            insumoId,
            teorico,
            contado,
            diferenca: Number((contado - teorico).toFixed(3)),
          };
        });
        const data = agoraISO();
        const contagem: Contagem = {
          id: novoId("cont"),
          lojaId,
          data,
          usuarioId,
          itens,
        };

        // Divergência relevante: > 3% do teórico OU > R$ 20 em valor.
        const relevantes = itens.filter((it) => {
          const valor = Math.abs(it.diferenca) * (custoPorInsumo.get(it.insumoId) ?? 0);
          const pct = it.teorico > 0 ? Math.abs(it.diferenca) / it.teorico : 1;
          return (it.teorico > 0 && pct > 0.03 && Math.abs(it.diferenca) > 0.01) || valor > 20;
        });
        const totalReais = itens.reduce(
          (soma, it) => soma + it.diferenca * (custoPorInsumo.get(it.insumoId) ?? 0),
          0,
        );

        const eventos = [...s.eventos];
        for (const it of relevantes) {
          const insumo = s.insumos.find((i) => i.id === it.insumoId);
          const valor = it.diferenca * (insumo?.custoMedio ?? 0);
          const sinal = it.diferenca < 0 ? "falta" : "sobra";
          eventos.push(
            registrarEvento(
              {
                tipo: "contagem_divergencia",
                lojaId,
                usuarioId,
                descricao: `Contagem: ${sinal} de ${formatQuantidade(Math.abs(it.diferenca), insumo?.unidade ?? "")} de ${insumo?.nome ?? "insumo"}`,
                valorImpacto: Number(valor.toFixed(2)),
                severidade: it.diferenca < 0 ? "critico" : "atencao",
                refId: contagem.id,
              },
              novoId("ev"),
              data,
            ),
          );
        }

        // A contagem registra o físico (não sobrescreve o teórico).
        const estoque = s.estoque.map((e) => {
          if (e.lojaId !== lojaId) return e;
          const it = itens.find((x) => x.insumoId === e.insumoId);
          return it ? { ...e, qtdUltimaContagem: it.contado, dataContagem: data } : e;
        });

        set({ contagens: [...s.contagens, contagem], estoque, eventos });
        return { contagem, totalReais: Number(totalReais.toFixed(2)), relevantes };
      },

      registrarTransferencia: (transferencia) =>
        set((s) => {
          const estoque = s.estoque.map((e) => ({ ...e }));
          for (const item of transferencia.itens) {
            if (item.qtd <= 0) continue;
            const saida = estoque.find(
              (e) => e.insumoId === item.insumoId && e.lojaId === transferencia.origemId,
            );
            if (saida) saida.qtdTeorica = Number((saida.qtdTeorica - item.qtd).toFixed(4));
            const entrada = estoque.find(
              (e) => e.insumoId === item.insumoId && e.lojaId === transferencia.destinoId,
            );
            if (entrada) {
              entrada.qtdTeorica = Number((entrada.qtdTeorica + item.qtd).toFixed(4));
            } else {
              estoque.push({
                insumoId: item.insumoId,
                lojaId: transferencia.destinoId,
                qtdTeorica: item.qtd,
                qtdUltimaContagem: 0,
                dataContagem: null,
              });
            }
          }
          const evento = registrarEvento(
            {
              tipo: "transferencia",
              lojaId: transferencia.origemId,
              usuarioId: transferencia.usuarioId,
              descricao: `Transferência de ${transferencia.itens.length} ${transferencia.itens.length === 1 ? "item" : "itens"} entre lojas`,
              severidade: "info",
              refId: transferencia.id,
            },
            novoId("ev"),
            transferencia.data,
          );
          return {
            transferencias: [...s.transferencias, transferencia],
            estoque,
            eventos: [...s.eventos, evento],
          };
        }),
    }),
    {
      name: "cereja-dados",
      // v4 (Fase 6): o seed mudou (teórico na data da contagem, movimentações)
      // e entraram ações de compra/contagem/transferência. Subir a versão
      // descarta o cache v3 e o useHidratado regenera o seed.
      version: 4,
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
