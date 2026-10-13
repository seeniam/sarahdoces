import type { Insumo } from "@/types";

/**
 * Insumos com unidades e custos médios realistas de São Luís/MA (R$ por
 * unidade base). ~38 itens cobrindo café da manhã, almoço, porções e doces.
 */
export const INSUMOS: Insumo[] = [
  // Proteína
  { id: "ins-carne", nome: "Carne bovina (coxão)", unidade: "kg", custoMedio: 38, estoqueMinimo: 8, categoria: "proteina" },
  { id: "ins-frango", nome: "Frango (peito/coxa)", unidade: "kg", custoMedio: 14, estoqueMinimo: 10, categoria: "proteina" },
  { id: "ins-linguica", nome: "Linguiça calabresa", unidade: "kg", custoMedio: 22, estoqueMinimo: 4, categoria: "proteina" },
  { id: "ins-bacon", nome: "Bacon", unidade: "kg", custoMedio: 32, estoqueMinimo: 2, categoria: "proteina" },
  { id: "ins-ovo", nome: "Ovo", unidade: "un", custoMedio: 0.9, estoqueMinimo: 120, categoria: "proteina" },

  // Grãos e mercearia
  { id: "ins-arroz", nome: "Arroz", unidade: "kg", custoMedio: 6, estoqueMinimo: 25, categoria: "graos" },
  { id: "ins-feijao", nome: "Feijão", unidade: "kg", custoMedio: 8.5, estoqueMinimo: 15, categoria: "graos" },
  { id: "ins-flocao", nome: "Flocão de milho (cuscuz)", unidade: "kg", custoMedio: 6, estoqueMinimo: 15, categoria: "graos" },
  { id: "ins-farofa", nome: "Farinha de mandioca", unidade: "kg", custoMedio: 7, estoqueMinimo: 8, categoria: "graos" },
  { id: "ins-goma", nome: "Goma de tapioca", unidade: "kg", custoMedio: 9, estoqueMinimo: 6, categoria: "graos" },
  { id: "ins-macarrao", nome: "Macarrão", unidade: "kg", custoMedio: 7, estoqueMinimo: 5, categoria: "graos" },
  { id: "ins-cafe-po", nome: "Café em pó", unidade: "kg", custoMedio: 28, estoqueMinimo: 6, categoria: "mercearia" },
  { id: "ins-acucar", nome: "Açúcar", unidade: "kg", custoMedio: 5, estoqueMinimo: 15, categoria: "mercearia" },
  { id: "ins-sal", nome: "Sal", unidade: "kg", custoMedio: 3, estoqueMinimo: 4, categoria: "mercearia" },
  { id: "ins-oleo", nome: "Óleo de soja", unidade: "L", custoMedio: 9, estoqueMinimo: 8, categoria: "mercearia" },
  { id: "ins-pao", nome: "Pão francês", unidade: "un", custoMedio: 0.6, estoqueMinimo: 80, categoria: "mercearia" },

  // Laticínios
  { id: "ins-leite", nome: "Leite", unidade: "L", custoMedio: 5.5, estoqueMinimo: 20, categoria: "laticinios" },
  { id: "ins-queijo", nome: "Queijo coalho", unidade: "kg", custoMedio: 42, estoqueMinimo: 4, categoria: "laticinios" },
  { id: "ins-manteiga", nome: "Manteiga", unidade: "kg", custoMedio: 38, estoqueMinimo: 3, categoria: "laticinios" },
  { id: "ins-leite-cond", nome: "Leite condensado", unidade: "un", custoMedio: 7, estoqueMinimo: 24, categoria: "laticinios" },
  { id: "ins-creme-leite", nome: "Creme de leite", unidade: "un", custoMedio: 4, estoqueMinimo: 24, categoria: "laticinios" },
  { id: "ins-requeijao", nome: "Requeijão", unidade: "un", custoMedio: 8, estoqueMinimo: 6, categoria: "laticinios" },

  // Hortifruti
  { id: "ins-tomate", nome: "Tomate", unidade: "kg", custoMedio: 7, estoqueMinimo: 6, categoria: "hortifruti" },
  { id: "ins-cebola", nome: "Cebola", unidade: "kg", custoMedio: 5, estoqueMinimo: 6, categoria: "hortifruti" },
  { id: "ins-alface", nome: "Alface", unidade: "un", custoMedio: 3, estoqueMinimo: 10, categoria: "hortifruti" },
  { id: "ins-batata", nome: "Batata", unidade: "kg", custoMedio: 6, estoqueMinimo: 10, categoria: "hortifruti" },
  { id: "ins-pimentao", nome: "Pimentão", unidade: "kg", custoMedio: 8, estoqueMinimo: 3, categoria: "hortifruti" },
  { id: "ins-cheiro-verde", nome: "Cheiro-verde", unidade: "un", custoMedio: 2, estoqueMinimo: 8, categoria: "hortifruti" },
  { id: "ins-acerola", nome: "Polpa de acerola", unidade: "kg", custoMedio: 11, estoqueMinimo: 4, categoria: "hortifruti" },
  { id: "ins-maracuja", nome: "Polpa de maracujá", unidade: "kg", custoMedio: 12, estoqueMinimo: 3, categoria: "hortifruti" },
  { id: "ins-laranja", nome: "Laranja", unidade: "kg", custoMedio: 5, estoqueMinimo: 8, categoria: "hortifruti" },
  { id: "ins-limao", nome: "Limão", unidade: "kg", custoMedio: 6, estoqueMinimo: 3, categoria: "hortifruti" },

  // Confeitaria
  { id: "ins-farinha-trigo", nome: "Farinha de trigo", unidade: "kg", custoMedio: 6, estoqueMinimo: 10, categoria: "confeitaria" },
  { id: "ins-choco-po", nome: "Chocolate em pó", unidade: "kg", custoMedio: 24, estoqueMinimo: 3, categoria: "confeitaria" },
  { id: "ins-granulado", nome: "Chocolate granulado", unidade: "kg", custoMedio: 20, estoqueMinimo: 2, categoria: "confeitaria" },
  { id: "ins-fermento", nome: "Fermento", unidade: "un", custoMedio: 5, estoqueMinimo: 6, categoria: "confeitaria" },

  // Bebidas
  { id: "ins-refri", nome: "Refrigerante lata", unidade: "un", custoMedio: 3, estoqueMinimo: 48, categoria: "bebidas" },
  { id: "ins-agua", nome: "Água mineral", unidade: "un", custoMedio: 1.2, estoqueMinimo: 48, categoria: "bebidas" },

  // Descartáveis
  { id: "ins-copo", nome: "Copo descartável", unidade: "pct", custoMedio: 8, estoqueMinimo: 10, categoria: "descartaveis" },
  { id: "ins-marmita", nome: "Marmita (viagem)", unidade: "un", custoMedio: 1.2, estoqueMinimo: 100, categoria: "descartaveis" },
];
