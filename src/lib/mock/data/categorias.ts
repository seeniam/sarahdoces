import type { Categoria } from "@/types";

/** 6 categorias, cada uma com o ícone de linha próprio. */
export const CATEGORIAS: Categoria[] = [
  { id: "cat-cafe", nome: "Café", icone: "xicara", ordem: 1 },
  { id: "cat-cuscuz", nome: "Cuscuz", icone: "cuscuzeira", ordem: 2 },
  { id: "cat-pf", nome: "Pratos", icone: "prato", ordem: 3 },
  { id: "cat-porcoes", nome: "Porções", icone: "frango", ordem: 4 },
  { id: "cat-bebidas", nome: "Bebidas", icone: "suco", ordem: 5 },
  { id: "cat-doces", nome: "Doces", icone: "bolo", ordem: 6 },
];
