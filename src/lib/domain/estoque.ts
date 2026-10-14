import type {
  BancoMock,
  Comanda,
  EstoqueLoja,
  FichaTecnica,
  Insumo,
  InsumoId,
  ItemComanda,
  ItemContagem,
  LojaId,
  Movimentacao,
  ProdutoId,
} from "@/types";
import { ROTULO_MOTIVO_PERDA } from "./perdas";

/** Adicional → insumo consumido (quantidade na unidade do insumo). */
export const ADICIONAL_INSUMO: Record<string, { insumoId: InsumoId; qtd: number }> = {
  "ad-ovo": { insumoId: "ins-ovo", qtd: 1 },
  "ad-bacon": { insumoId: "ins-bacon", qtd: 0.03 },
  "ad-queijo": { insumoId: "ins-queijo", qtd: 0.03 },
  "ad-farofa": { insumoId: "ins-farofa", qtd: 0.03 },
};

/**
 * Consumo teórico de insumos de uma comanda (soma das fichas × qtd + adicionais).
 * Retorna um mapa insumoId → quantidade consumida.
 */
export function consumoDaComanda(
  comanda: Comanda,
  fichasByProduto: Map<ProdutoId, FichaTecnica>,
): Map<InsumoId, number> {
  const consumo = new Map<InsumoId, number>();
  const somar = (insumoId: InsumoId, qtd: number) =>
    consumo.set(insumoId, (consumo.get(insumoId) ?? 0) + qtd);

  for (const item of comanda.itens) {
    // Item cancelado não consome insumo (o estorno é tratado à parte).
    if (item.cancelado) continue;
    const ficha = fichasByProduto.get(item.produtoId);
    if (ficha) {
      for (const ing of ficha.itens) somar(ing.insumoId, ing.qtd * item.qtd);
    }
    for (const ad of item.adicionais) {
      const map = ADICIONAL_INSUMO[ad.id];
      if (map) somar(map.insumoId, map.qtd * item.qtd);
    }
  }
  return consumo;
}

/**
 * Estorna (soma de volta) a baixa de UM item da comanda no estoque da loja.
 * Usado quando um item é cancelado ANTES de ser preparado. Função pura.
 * O item sintético força `cancelado: false` para que o consumo seja calculado
 * mesmo sendo um item que acabou de ser marcado como cancelado.
 */
export function estornarEstoqueDeItem(
  estoque: EstoqueLoja[],
  comanda: Comanda,
  item: ItemComanda,
  fichasByProduto: Map<ProdutoId, FichaTecnica>,
): EstoqueLoja[] {
  const consumo = consumoDaComanda(
    { ...comanda, itens: [{ ...item, cancelado: false }] },
    fichasByProduto,
  );
  if (consumo.size === 0) return estoque;
  return estoque.map((e) => {
    if (e.lojaId !== comanda.lojaId) return e;
    const volta = consumo.get(e.insumoId);
    if (!volta) return e;
    return { ...e, qtdTeorica: e.qtdTeorica + volta };
  });
}

/**
 * Baixa o estoque teórico da loja da comanda pela ficha técnica.
 * Função pura: devolve um NOVO array de estoque (não muta o original).
 * Permite ficar negativo (reflete venda sem cobertura de estoque).
 */
export function baixarEstoquePorComanda(
  estoque: EstoqueLoja[],
  comanda: Comanda,
  fichasByProduto: Map<ProdutoId, FichaTecnica>,
): EstoqueLoja[] {
  const consumo = consumoDaComanda(comanda, fichasByProduto);
  if (consumo.size === 0) return estoque;

  return estoque.map((e) => {
    if (e.lojaId !== comanda.lojaId) return e;
    const baixa = consumo.get(e.insumoId);
    if (!baixa) return e;
    return { ...e, qtdTeorica: e.qtdTeorica - baixa };
  });
}

/**
 * Divergência de um item de contagem: contado − teórico.
 * Negativo = falta (sumiu do estoque sem explicação).
 */
export function calcularDivergencia(item: {
  teorico: number;
  contado: number;
}): number {
  return item.contado - item.teorico;
}

/** Converte uma contagem em itens com diferença + total em R$ (valor da falta/sobra). */
export function divergenciaContagem(
  itens: { insumoId: InsumoId; teorico: number; contado: number }[],
  insumos: Insumo[],
): { itens: ItemContagem[]; totalReais: number } {
  const custos = new Map(insumos.map((i) => [i.id, i.custoMedio]));
  let totalReais = 0;
  const resultado: ItemContagem[] = itens.map((it) => {
    const diferenca = calcularDivergencia(it);
    totalReais += diferenca * (custos.get(it.insumoId) ?? 0);
    return { insumoId: it.insumoId, teorico: it.teorico, contado: it.contado, diferenca };
  });
  return { itens: resultado, totalReais };
}

/** Insumos abaixo do estoque mínimo, por loja. */
export function insumosEmFalta(
  estoque: EstoqueLoja[],
  insumos: Insumo[],
): EstoqueLoja[] {
  const minimo = new Map(insumos.map((i) => [i.id, i.estoqueMinimo]));
  return estoque.filter((e) => e.qtdTeorica < (minimo.get(e.insumoId) ?? 0));
}

// ----------------------------------------------------------------------------
// Nível de estoque
// ----------------------------------------------------------------------------
export type StatusEstoque = "ok" | "baixo" | "critico";

/** Status do nível de estoque frente ao mínimo (crítico < metade do mínimo). */
export function statusEstoque(teorico: number, minimo: number): StatusEstoque {
  if (teorico <= 0 || teorico < minimo * 0.5) return "critico";
  if (teorico < minimo) return "baixo";
  return "ok";
}

const ROTULO_STATUS: Record<StatusEstoque, string> = {
  ok: "Em dia",
  baixo: "Baixo",
  critico: "Crítico",
};
export function rotuloStatusEstoque(s: StatusEstoque): string {
  return ROTULO_STATUS[s];
}

// ----------------------------------------------------------------------------
// Custo médio ponderado (atualizado a cada compra)
// ----------------------------------------------------------------------------
/**
 * Novo custo médio após uma compra. Pondera o estoque atual (ao custo antigo)
 * com a quantidade comprada (ao custo da nota). Estoque negativo não credita
 * custo (conta como zero). Função pura.
 */
export function custoMedioPonderado(args: {
  qtdAtual: number;
  custoAtual: number;
  qtdCompra: number;
  custoUnitCompra: number;
}): number {
  const { qtdAtual, custoAtual, qtdCompra, custoUnitCompra } = args;
  const base = Math.max(0, qtdAtual);
  const total = base + qtdCompra;
  if (total <= 0) return custoUnitCompra;
  return (base * custoAtual + qtdCompra * custoUnitCompra) / total;
}

// ----------------------------------------------------------------------------
// Movimentações (extrato) — estoque teórico = soma das movimentações
// ----------------------------------------------------------------------------
const DIA_MS = 24 * 60 * 60 * 1000;
const TZ_ESTOQUE = "America/Fortaleza";
const fmtDiaEstoque = new Intl.DateTimeFormat("en-CA", { timeZone: TZ_ESTOQUE });
/** Chave de dia (YYYY-MM-DD) em São Luís para agrupar o consumo diário. */
function diaChave(iso: string): string {
  return fmtDiaEstoque.format(new Date(iso));
}

/**
 * Instante da 1ª data registrada no banco (comandas/compras). Âncora
 * determinística para o saldo inicial de insumos sem movimentação própria.
 */
function inicioDoBanco(banco: BancoMock): number {
  let min = Infinity;
  for (const c of banco.comandas) min = Math.min(min, new Date(c.criadaEm).getTime());
  for (const c of banco.compras) min = Math.min(min, new Date(c.data).getTime());
  return Number.isFinite(min) ? min : 0;
}

/**
 * Extrato de um insumo numa loja: saldo inicial + compras + consumo diário
 * (via ficha) + perdas + transferências + ajuste da contagem, ordenado por
 * data. É DERIVADO das coleções do banco — a soma reproduz o estoque teórico.
 * O saldo inicial é o "plug" que reconcilia a soma ao teórico atual gravado.
 */
export function construirMovimentacoes(
  banco: BancoMock,
  insumoId: InsumoId,
  lojaId: LojaId,
  fichasByProduto: Map<ProdutoId, FichaTecnica>,
): Movimentacao[] {
  const movs: Movimentacao[] = [];
  const fornecedorPorCompra = new Map(banco.compras.map((c) => [c.id, c.fornecedor]));

  // Compras
  for (const compra of banco.compras) {
    if (compra.lojaId !== lojaId) continue;
    for (const item of compra.itens) {
      if (item.insumoId !== insumoId || item.qtd <= 0) continue;
      movs.push({
        id: `mov-cmp-${compra.id}-${insumoId}`,
        data: compra.data,
        lojaId,
        insumoId,
        tipo: "compra",
        qtd: item.qtd,
        custoUnit: item.qtd > 0 ? item.valor / item.qtd : undefined,
        usuarioId: compra.usuarioId,
        refId: compra.id,
        descricao: `Compra · ${fornecedorPorCompra.get(compra.id) ?? ""}`,
      });
    }
  }

  // Consumo por venda, agregado por dia (mantém o extrato legível).
  const consumoPorDia = new Map<string, number>();
  for (const c of banco.comandas) {
    if (c.lojaId !== lojaId || c.status === "cancelada") continue;
    const uso = consumoDaComanda(c, fichasByProduto).get(insumoId);
    if (!uso) continue;
    const dia = diaChave(c.criadaEm);
    consumoPorDia.set(dia, (consumoPorDia.get(dia) ?? 0) + uso);
  }
  for (const [dia, qtd] of consumoPorDia) {
    if (qtd <= 0) continue;
    movs.push({
      id: `mov-cons-${lojaId}-${insumoId}-${dia}`,
      // Meio-dia local → fica depois do saldo inicial e dentro do dia certo.
      data: new Date(`${dia}T12:00:00-03:00`).toISOString(),
      lojaId,
      insumoId,
      tipo: "consumo",
      qtd: -qtd,
      descricao: "Consumo por vendas do dia",
    });
  }

  // Perdas (nível de insumo)
  for (const p of banco.perdas) {
    if (p.lojaId !== lojaId || p.insumoId !== insumoId || p.qtd <= 0) continue;
    movs.push({
      id: `mov-perda-${p.id}`,
      data: p.data,
      lojaId,
      insumoId,
      tipo: "perda",
      qtd: -p.qtd,
      usuarioId: p.usuarioId,
      refId: p.id,
      descricao: `Perda · ${ROTULO_MOTIVO_PERDA[p.motivo]}`,
    });
  }

  // Transferências
  for (const t of banco.transferencias) {
    const item = t.itens.find((i) => i.insumoId === insumoId);
    if (!item || item.qtd <= 0) continue;
    if (t.destinoId === lojaId) {
      movs.push({
        id: `mov-transf-in-${t.id}-${insumoId}`,
        data: t.data,
        lojaId,
        insumoId,
        tipo: "transferencia_entrada",
        qtd: item.qtd,
        usuarioId: t.usuarioId,
        refId: t.id,
        descricao: "Transferência recebida",
      });
    }
    if (t.origemId === lojaId) {
      movs.push({
        id: `mov-transf-out-${t.id}-${insumoId}`,
        data: t.data,
        lojaId,
        insumoId,
        tipo: "transferencia_saida",
        qtd: -item.qtd,
        usuarioId: t.usuarioId,
        refId: t.id,
        descricao: "Transferência enviada",
      });
    }
  }

  // Saldo inicial = teórico atual − (entradas − saídas), sem contar o ajuste.
  const teoricoAtual =
    banco.estoque.find((e) => e.insumoId === insumoId && e.lojaId === lojaId)
      ?.qtdTeorica ?? 0;
  const fluxo = movs.reduce((s, m) => s + m.qtd, 0);
  const saldoInicial = Number((teoricoAtual - fluxo).toFixed(4));
  // Data do saldo: um dia antes da 1ª movimentação deste insumo OU, se ele não
  // tem nenhuma movimentação, um dia antes do início do banco (nunca `new
  // Date()`, que quebraria o determinismo do seed e o estoqueTeorico(ate)).
  const primeiraMov = movs.length
    ? movs.reduce((min, m) => Math.min(min, new Date(m.data).getTime()), Infinity)
    : inicioDoBanco(banco);
  const dataInicial = new Date(primeiraMov - DIA_MS).toISOString();
  movs.push({
    id: `mov-ini-${lojaId}-${insumoId}`,
    data: dataInicial,
    lojaId,
    insumoId,
    tipo: "saldo_inicial",
    qtd: saldoInicial,
    descricao: "Saldo inicial do período",
  });

  // Ajuste da contagem (acerto do teórico ao físico) — NÃO entra no teórico.
  for (const cont of banco.contagens) {
    if (cont.lojaId !== lojaId) continue;
    const item = cont.itens.find((i) => i.insumoId === insumoId);
    if (!item) continue;
    movs.push({
      id: `mov-ajuste-${cont.id}-${insumoId}`,
      data: cont.data,
      lojaId,
      insumoId,
      tipo: "ajuste_contagem",
      qtd: item.diferenca,
      usuarioId: cont.usuarioId,
      refId: cont.id,
      descricao: "Contagem física",
    });
  }

  return movs.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
}

/**
 * Estoque teórico de um insumo numa loja. Sem `ate`, usa o teórico gravado
 * (rápido e já mantido pelas mutações). Com `ate`, soma as movimentações até a
 * data (exclui o ajuste de contagem — teórico puro = compras − consumo − perdas).
 */
export function estoqueTeorico(
  banco: BancoMock,
  insumoId: InsumoId,
  lojaId: LojaId,
  fichasByProduto: Map<ProdutoId, FichaTecnica>,
  ate?: Date,
): number {
  if (!ate) {
    return (
      banco.estoque.find((e) => e.insumoId === insumoId && e.lojaId === lojaId)
        ?.qtdTeorica ?? 0
    );
  }
  const ateMs = ate.getTime();
  const movs = construirMovimentacoes(banco, insumoId, lojaId, fichasByProduto);
  return movs
    .filter((m) => m.tipo !== "ajuste_contagem" && new Date(m.data).getTime() <= ateMs)
    .reduce((s, m) => s + m.qtd, 0);
}

// ----------------------------------------------------------------------------
// "Para onde foi a carne?" — balanço de um insumo num período
// ----------------------------------------------------------------------------
export interface BalancoInsumo {
  insumoId: InsumoId;
  lojaId: LojaId;
  unidade: string;
  custoMedio: number;
  periodo: { de: string; ate: string; dias: number };
  temContagem: boolean;
  /** Quantidades (unidade do insumo). */
  estoqueInicio: number;
  comprado: number;
  vendido: number;
  perdido: number;
  transferenciaEntrada: number;
  transferenciaSaida: number;
  emEstoque: number; // físico contado (ou teórico, se não houver contagem)
  teoricoFim: number;
  semExplicacao: number; // teórico − contado (a falta que ninguém registrou)
  /** Total do balanço (tudo que esteve disponível no período). */
  disponivel: number;
}

/** Converte uma quantidade do balanço em R$ ao custo médio. */
export function emReais(balanco: BalancoInsumo, qtd: number): number {
  return qtd * balanco.custoMedio;
}

/**
 * Balanço de um insumo numa loja num período que TERMINA na última contagem
 * (para a conta bater com a divergência do painel). "Sem explicação" é o
 * teórico ao fim menos o físico contado — a mesma falta que o painel mostra.
 */
export function balancoInsumo(
  banco: BancoMock,
  insumoId: InsumoId,
  lojaId: LojaId,
  fichasByProduto: Map<ProdutoId, FichaTecnica>,
  opts: { dias?: number; agora?: Date } = {},
): BalancoInsumo {
  const dias = opts.dias ?? 7;
  const insumo = banco.insumos.find((i) => i.id === insumoId);
  const movs = construirMovimentacoes(banco, insumoId, lojaId, fichasByProduto);

  // Contagem de referência: a mais recente da loja que inclui o insumo.
  const contagens = banco.contagens
    .filter((c) => c.lojaId === lojaId && c.itens.some((i) => i.insumoId === insumoId))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const contRef = contagens[0];
  const itemCont = contRef?.itens.find((i) => i.insumoId === insumoId);

  const fimMs = contRef
    ? new Date(contRef.data).getTime()
    : (opts.agora?.getTime() ??
        movs.reduce((max, m) => Math.max(max, new Date(m.data).getTime()), 0));
  const inicioMs = fimMs - dias * DIA_MS;

  const noPeriodo = (iso: string) => {
    const t = new Date(iso).getTime();
    return t > inicioMs && t <= fimMs;
  };

  let comprado = 0;
  let vendido = 0;
  let perdido = 0;
  let transferenciaEntrada = 0;
  let transferenciaSaida = 0;
  for (const m of movs) {
    if (!noPeriodo(m.data)) continue;
    if (m.tipo === "compra") comprado += m.qtd;
    else if (m.tipo === "consumo") vendido += -m.qtd;
    else if (m.tipo === "perda") perdido += -m.qtd;
    else if (m.tipo === "transferencia_entrada") transferenciaEntrada += m.qtd;
    else if (m.tipo === "transferencia_saida") transferenciaSaida += -m.qtd;
  }

  const estoqueInicio = movs
    .filter((m) => m.tipo !== "ajuste_contagem" && new Date(m.data).getTime() <= inicioMs)
    .reduce((s, m) => s + m.qtd, 0);
  const teoricoFim =
    estoqueInicio + comprado - vendido - perdido + transferenciaEntrada - transferenciaSaida;
  const emEstoque = itemCont ? itemCont.contado : teoricoFim;
  const semExplicacao = Number((teoricoFim - emEstoque).toFixed(3));
  const disponivel = estoqueInicio + comprado + transferenciaEntrada;

  return {
    insumoId,
    lojaId,
    unidade: insumo?.unidade ?? "un",
    custoMedio: insumo?.custoMedio ?? 0,
    periodo: {
      de: new Date(inicioMs).toISOString(),
      ate: new Date(fimMs).toISOString(),
      dias,
    },
    temContagem: Boolean(contRef),
    estoqueInicio: Number(estoqueInicio.toFixed(3)),
    comprado: Number(comprado.toFixed(3)),
    vendido: Number(vendido.toFixed(3)),
    perdido: Number(perdido.toFixed(3)),
    transferenciaEntrada: Number(transferenciaEntrada.toFixed(3)),
    transferenciaSaida: Number(transferenciaSaida.toFixed(3)),
    emEstoque: Number(emEstoque.toFixed(3)),
    teoricoFim: Number(teoricoFim.toFixed(3)),
    semExplicacao,
    disponivel: Number(disponivel.toFixed(3)),
  };
}
