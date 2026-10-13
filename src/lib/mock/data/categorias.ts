import type { Categoria } from "@/types";

/** 6 categorias, cada uma com o ícone de linha próprio. */
export const CATEGORIAS: Categoria[] = [
  { id: "cat-cafe", nome: "Café da manhã", icone: "xicara", ordem: 1 },
  { id: "cat-cuscuz", nome: "Cuscuz & Tapioca", icone: "cuscuzeira", ordem: 2 },
  { id: "cat-pf", nome: "PF & Pratos", icone: "prato", ordem: 3 },
  { id: "cat-porcoes", nome: "Porções", icone: "frango", ordem: 4 },
  { id: "cat-bebidas", nome: "Bebidas", icone: "suco", ordem: 5 },
  { id: "cat-doces", nome: "Doces & Bolos", icone: "bolo", ordem: 6 },
];
