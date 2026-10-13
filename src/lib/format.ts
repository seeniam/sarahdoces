/**
 * Formatação pt-BR centralizada. Moeda SEMPRE via formatBRL (CLAUDE.md).
 * O sinal negativo usa o "minus sign" tipográfico (U+2212), não hífen.
 */

const MINUS = "−";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brlNoSymbol = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** R$ 1.234,56 */
export function formatBRL(valor: number): string {
  return brl.format(valor);
}

/** 1.234,56 (sem o símbolo, para colunas com o R$ no cabeçalho) */
export function formatBRLValor(valor: number): string {
  return brlNoSymbol.format(valor);
}

/** Diferenças com sinal explícito: −R$ 37,00 / +R$ 12,00 */
export function formatBRLSinalado(valor: number): string {
  const absoluto = brl.format(Math.abs(valor));
  if (valor < 0) return `${MINUS}${absoluto}`;
  if (valor > 0) return `+${absoluto}`;
  return absoluto;
}

/** 1.234 */
export function formatNumero(valor: number, casas = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor);
}

/** 12,4% */
export function formatPorcentagem(fracao: number, casas = 1): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(fracao);
}

/** Quantidade com unidade: "2,4 kg", "13 un" */
export function formatQuantidade(valor: number, unidade: string): string {
  const casas = Number.isInteger(valor) ? 0 : valor < 10 ? 1 : 0;
  return `${formatNumero(valor, casas)} ${unidade}`;
}
