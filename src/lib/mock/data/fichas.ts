import type { FichaTecnica } from "@/types";

/**
 * Fichas técnicas de TODOS os produtos. `qtd` na unidade do insumo.
 * `rendimento` = fator de correção/cocção (cru → pronto) nas proteínas.
 */
export const FICHAS: FichaTecnica[] = [
  // Café da manhã
  { id: "ficha-cafe", produtoId: "prod-cafe", itens: [{ insumoId: "ins-cafe-po", qtd: 0.012 }, { insumoId: "ins-acucar", qtd: 0.008 }] },
  { id: "ficha-cafe-leite", produtoId: "prod-cafe-leite", itens: [{ insumoId: "ins-cafe-po", qtd: 0.01 }, { insumoId: "ins-leite", qtd: 0.1 }, { insumoId: "ins-acucar", qtd: 0.008 }] },
  { id: "ficha-pao-chapa", produtoId: "prod-pao-chapa", itens: [{ insumoId: "ins-pao", qtd: 2 }, { insumoId: "ins-manteiga", qtd: 0.012 }] },
  { id: "ficha-ovos", produtoId: "prod-ovos", itens: [{ insumoId: "ins-ovo", qtd: 2 }, { insumoId: "ins-manteiga", qtd: 0.008 }, { insumoId: "ins-cheiro-verde", qtd: 0.1 }] },

  // Cuscuz & Tapioca
  { id: "ficha-cuscuz-ovo", produtoId: "prod-cuscuz-ovo", itens: [{ insumoId: "ins-flocao", qtd: 0.08 }, { insumoId: "ins-ovo", qtd: 1 }, { insumoId: "ins-manteiga", qtd: 0.01 }] },
  { id: "ficha-cuscuz-completo", produtoId: "prod-cuscuz-completo", itens: [{ insumoId: "ins-flocao", qtd: 0.1 }, { insumoId: "ins-ovo", qtd: 2 }, { insumoId: "ins-queijo", qtd: 0.04 }, { insumoId: "ins-linguica", qtd: 0.05 }, { insumoId: "ins-manteiga", qtd: 0.01 }] },
  { id: "ficha-tapioca-coco", produtoId: "prod-tapioca-coco", itens: [{ insumoId: "ins-goma", qtd: 0.08 }, { insumoId: "ins-acucar", qtd: 0.01 }] },
  { id: "ficha-tapioca-frango", produtoId: "prod-tapioca-frango", itens: [{ insumoId: "ins-goma", qtd: 0.09 }, { insumoId: "ins-frango", qtd: 0.08 }, { insumoId: "ins-queijo", qtd: 0.03 }], rendimento: 0.7 },

  // PF & Pratos
  { id: "ficha-pf-carne", produtoId: "prod-pf-carne", itens: [{ insumoId: "ins-arroz", qtd: 0.15 }, { insumoId: "ins-feijao", qtd: 0.08 }, { insumoId: "ins-carne", qtd: 0.12 }, { insumoId: "ins-farofa", qtd: 0.03 }, { insumoId: "ins-tomate", qtd: 0.03 }, { insumoId: "ins-alface", qtd: 0.1 }], rendimento: 0.65 },
  { id: "ficha-pf-frango", produtoId: "prod-pf-frango", itens: [{ insumoId: "ins-arroz", qtd: 0.15 }, { insumoId: "ins-feijao", qtd: 0.08 }, { insumoId: "ins-frango", qtd: 0.15 }, { insumoId: "ins-farofa", qtd: 0.03 }, { insumoId: "ins-tomate", qtd: 0.03 }, { insumoId: "ins-alface", qtd: 0.1 }], rendimento: 0.7 },

  // Porções
  { id: "ficha-porcao-frango", produtoId: "prod-porcao-frango", itens: [{ insumoId: "ins-frango", qtd: 0.4 }, { insumoId: "ins-oleo", qtd: 0.05 }, { insumoId: "ins-batata", qtd: 0.1 }], rendimento: 0.7 },
  { id: "ficha-porcao-carne", produtoId: "prod-porcao-carne", itens: [{ insumoId: "ins-carne", qtd: 0.35 }, { insumoId: "ins-cebola", qtd: 0.05 }, { insumoId: "ins-pimentao", qtd: 0.03 }], rendimento: 0.65 },

  // Bebidas
  { id: "ficha-suco", produtoId: "prod-suco", itens: [{ insumoId: "ins-acerola", qtd: 0.1 }, { insumoId: "ins-acucar", qtd: 0.02 }] },
  { id: "ficha-cafe-gelado", produtoId: "prod-cafe-gelado", itens: [{ insumoId: "ins-cafe-po", qtd: 0.012 }, { insumoId: "ins-leite", qtd: 0.1 }, { insumoId: "ins-leite-cond", qtd: 0.03 }] },
  { id: "ficha-refri", produtoId: "prod-refri", itens: [{ insumoId: "ins-refri", qtd: 1 }] },
  { id: "ficha-agua", produtoId: "prod-agua", itens: [{ insumoId: "ins-agua", qtd: 1 }] },

  // Doces & Bolos
  { id: "ficha-fatia-bolo", produtoId: "prod-fatia-bolo", itens: [{ insumoId: "ins-farinha-trigo", qtd: 0.05 }, { insumoId: "ins-ovo", qtd: 0.5 }, { insumoId: "ins-acucar", qtd: 0.04 }, { insumoId: "ins-manteiga", qtd: 0.02 }, { insumoId: "ins-choco-po", qtd: 0.01 }] },
  { id: "ficha-brigadeiro", produtoId: "prod-brigadeiro", itens: [{ insumoId: "ins-leite-cond", qtd: 0.15 }, { insumoId: "ins-choco-po", qtd: 0.01 }, { insumoId: "ins-granulado", qtd: 0.005 }] },
  { id: "ficha-torta-limao", produtoId: "prod-torta-limao", itens: [{ insumoId: "ins-farinha-trigo", qtd: 0.04 }, { insumoId: "ins-leite-cond", qtd: 0.1 }, { insumoId: "ins-creme-leite", qtd: 0.5 }, { insumoId: "ins-limao", qtd: 0.03 }] },
  { id: "ficha-bolo-pote", produtoId: "prod-bolo-pote", itens: [{ insumoId: "ins-farinha-trigo", qtd: 0.05 }, { insumoId: "ins-leite-cond", qtd: 0.1 }, { insumoId: "ins-creme-leite", qtd: 0.5 }, { insumoId: "ins-choco-po", qtd: 0.02 }] },
];
