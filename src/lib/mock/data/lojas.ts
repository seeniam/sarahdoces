import type { Loja } from "@/types";

/**
 * Nomes placeholders (fáceis de renomear quando a gerência confirmar).
 * Loja 1 = cereja, Loja 2 = azulejo em todo o sistema.
 */
export const LOJAS: Loja[] = [
  {
    id: "loja-1",
    nome: "Loja 1 — Centro",
    endereco: "Rua Grande, Centro — São Luís/MA",
    cor: "loja-1",
  },
  {
    id: "loja-2",
    nome: "Loja 2 — Cohama",
    endereco: "Av. dos Holandeses, Cohama — São Luís/MA",
    cor: "loja-2",
  },
];

export const LOJA_1 = "loja-1";
export const LOJA_2 = "loja-2";
