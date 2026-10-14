import type {
  Comanda,
  EstoqueLoja,
  FichaTecnica,
  Insumo,
  InsumoId,
  ItemComanda,
  ItemContagem,
  ProdutoId,
} from "@/types";

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
