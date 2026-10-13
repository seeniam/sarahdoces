import type { FichaTecnica, Insumo, InsumoId, ItemFicha } from "@/types";

/** Índice insumoId → custo médio, para lookups O(1). */
export function custoPorInsumo(insumos: Insumo[]): Map<InsumoId, number> {
  return new Map(insumos.map((i) => [i.id, i.custoMedio]));
}

/** Soma qtd × custoMedio dos itens. */
export function custoDosItens(
  itens: ItemFicha[],
  custos: Map<InsumoId, number>,
): number {
  return itens.reduce(
    (total, item) => total + item.qtd * (custos.get(item.insumoId) ?? 0),
    0,
  );
}

/**
 * CMV (custo de mercadoria vendida) de um produto a partir da ficha técnica.
 * Sem ficha → 0.
 */
export function calcularCMV(
  ficha: FichaTecnica | undefined,
  insumos: Insumo[],
): number {
  if (!ficha) return 0;
  return custoDosItens(ficha.itens, custoPorInsumo(insumos));
}

/** Margem de contribuição relativa: (preço − custo) / preço. */
export function margem(preco: number, custo: number): number {
  if (preco <= 0) return 0;
  return (preco - custo) / preco;
}
