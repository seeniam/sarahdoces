import type { Produto } from "@/types";

/** Produto sem `custo` — o CMV é calculado a partir da ficha técnica. */
export type ProdutoCatalogo = Omit<Produto, "custo">;

const AD = {
  ovo: { id: "ad-ovo", nome: "Ovo frito", preco: 2 },
  bacon: { id: "ad-bacon", nome: "Bacon", preco: 3 },
  queijo: { id: "ad-queijo", nome: "Queijo coalho", preco: 3 },
  farofa: { id: "ad-farofa", nome: "Farofa", preco: 2 },
} as const;

const F = "/images/produtos";

export const PRODUTOS_CATALOGO: ProdutoCatalogo[] = [
  // Café da manhã
  { id: "prod-cafe", nome: "Café", categoriaId: "cat-cafe", preco: 3, ativo: true, foto: null, fichaTecnicaId: "ficha-cafe", adicionais: [] },
  { id: "prod-cafe-leite", nome: "Café com leite", categoriaId: "cat-cafe", preco: 4, ativo: true, foto: null, fichaTecnicaId: "ficha-cafe-leite", adicionais: [] },
  { id: "prod-pao-chapa", nome: "Pão na chapa", categoriaId: "cat-cafe", preco: 5, ativo: true, foto: null, fichaTecnicaId: "ficha-pao-chapa", adicionais: [AD.ovo, AD.queijo] },
  { id: "prod-ovos", nome: "Ovos mexidos", categoriaId: "cat-cafe", preco: 7, ativo: true, foto: null, fichaTecnicaId: "ficha-ovos", adicionais: [AD.bacon] },

  // Cuscuz & Tapioca
  { id: "prod-cuscuz-ovo", nome: "Cuscuz com ovo", categoriaId: "cat-cuscuz", preco: 8, ativo: true, foto: null, fichaTecnicaId: "ficha-cuscuz-ovo", adicionais: [AD.ovo, AD.queijo, AD.bacon] },
  { id: "prod-cuscuz-completo", nome: "Cuscuz completo", categoriaId: "cat-cuscuz", preco: 14, ativo: true, foto: null, fichaTecnicaId: "ficha-cuscuz-completo", adicionais: [AD.ovo] },
  { id: "prod-tapioca-coco", nome: "Tapioca de coco", categoriaId: "cat-cuscuz", preco: 7, ativo: true, foto: null, fichaTecnicaId: "ficha-tapioca-coco", adicionais: [] },
  { id: "prod-tapioca-frango", nome: "Tapioca de frango", categoriaId: "cat-cuscuz", preco: 12, ativo: true, foto: null, fichaTecnicaId: "ficha-tapioca-frango", adicionais: [AD.queijo] },

  // PF & Pratos
  { id: "prod-pf-carne", nome: "PF de carne", categoriaId: "cat-pf", preco: 20, ativo: true, foto: null, fichaTecnicaId: "ficha-pf-carne", adicionais: [AD.ovo, AD.farofa] },
  { id: "prod-pf-frango", nome: "PF de frango", categoriaId: "cat-pf", preco: 20, ativo: true, foto: null, fichaTecnicaId: "ficha-pf-frango", adicionais: [AD.ovo, AD.farofa] },

  // Porções
  { id: "prod-porcao-frango", nome: "Porção de frango", categoriaId: "cat-porcoes", preco: 25, ativo: true, foto: null, fichaTecnicaId: "ficha-porcao-frango", adicionais: [] },
  { id: "prod-porcao-carne", nome: "Porção de carne", categoriaId: "cat-porcoes", preco: 30, ativo: true, foto: null, fichaTecnicaId: "ficha-porcao-carne", adicionais: [] },

  // Bebidas
  { id: "prod-suco", nome: "Suco natural", categoriaId: "cat-bebidas", preco: 6, ativo: true, foto: `${F}/suco-natural.jpg`, fichaTecnicaId: "ficha-suco", adicionais: [] },
  { id: "prod-cafe-gelado", nome: "Café gelado", categoriaId: "cat-bebidas", preco: 7, ativo: true, foto: null, fichaTecnicaId: "ficha-cafe-gelado", adicionais: [] },
  { id: "prod-refri", nome: "Refrigerante lata", categoriaId: "cat-bebidas", preco: 5, ativo: true, foto: null, fichaTecnicaId: "ficha-refri", adicionais: [] },
  { id: "prod-agua", nome: "Água mineral", categoriaId: "cat-bebidas", preco: 3, ativo: true, foto: null, fichaTecnicaId: "ficha-agua", adicionais: [] },

  // Doces & Bolos
  { id: "prod-fatia-bolo", nome: "Fatia de bolo", categoriaId: "cat-doces", preco: 9, ativo: true, foto: `${F}/fatia-de-bolo.jpg`, fichaTecnicaId: "ficha-fatia-bolo", adicionais: [] },
  { id: "prod-brigadeiro", nome: "Brigadeiro gourmet", categoriaId: "cat-doces", preco: 4, ativo: true, foto: null, fichaTecnicaId: "ficha-brigadeiro", adicionais: [] },
  { id: "prod-torta-limao", nome: "Torta de limão", categoriaId: "cat-doces", preco: 10, ativo: true, foto: null, fichaTecnicaId: "ficha-torta-limao", adicionais: [] },
  { id: "prod-bolo-pote", nome: "Bolo de pote", categoriaId: "cat-doces", preco: 12, ativo: true, foto: null, fichaTecnicaId: "ficha-bolo-pote", adicionais: [] },
];
