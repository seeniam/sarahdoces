import type { FichaTecnica, Insumo, Produto, ProdutoId } from "@/types";
import { calcularCMV } from "@/lib/domain/cmv";
import { INSUMOS } from "./insumos";
import { FICHAS } from "./fichas";
import { PRODUTOS_CATALOGO } from "./produtos";

export { LOJAS, LOJA_1, LOJA_2 } from "./lojas";
export { USUARIOS, ATENDENTE_ANOMALIA } from "./usuarios";
export { CATEGORIAS } from "./categorias";
export { INSUMOS } from "./insumos";
export { FICHAS } from "./fichas";
export { PRODUTOS_CATALOGO } from "./produtos";

/** Ficha por produto. */
export const FICHA_POR_PRODUTO: Map<ProdutoId, FichaTecnica> = new Map(
  FICHAS.map((f) => [f.produtoId, f]),
);

/** Produtos com `custo` (CMV) calculado a partir da ficha técnica. */
export const PRODUTOS: Produto[] = PRODUTOS_CATALOGO.map((p) => ({
  ...p,
  custo: Number(
    calcularCMV(FICHA_POR_PRODUTO.get(p.id), INSUMOS).toFixed(4),
  ),
}));

export const PRODUTO_POR_ID: Map<ProdutoId, Produto> = new Map(
  PRODUTOS.map((p) => [p.id, p]),
);

export const INSUMO_POR_ID: Map<string, Insumo> = new Map(
  INSUMOS.map((i) => [i.id, i]),
);
