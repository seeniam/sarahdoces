/**
 * DRE simplificada em cascata e fechamento de caixa cego.
 * Funções puras — recebem totais já agregados.
 */

export interface DRE {
  faturamento: number;
  cmv: number;
  perdas: number;
  despesas: number;
  lucro: number;
  /** lucro / faturamento. */
  margemLucro: number;
}

export function calcularDRE(params: {
  faturamento: number;
  cmv: number;
  perdas: number;
  despesas: number;
}): DRE {
  const { faturamento, cmv, perdas, despesas } = params;
  const lucro = faturamento - cmv - perdas - despesas;
  const margemLucro = faturamento > 0 ? lucro / faturamento : 0;
  return { faturamento, cmv, perdas, despesas, lucro, margemLucro };
}

export interface FechamentoCaixa {
  valorEsperado: number;
  /** valorInformado − valorEsperado. Negativo = falta na gaveta. */
  diferenca: number;
}

/**
 * Fechamento cego: o atendente informa o valor sem ver o esperado.
 * esperado = inicial + dinheiro recebido − sangrias.
 */
export function fecharCaixaCego(params: {
  valorInicial: number;
  totalDinheiro: number;
  totalSangrias: number;
  valorInformado: number;
}): FechamentoCaixa {
  const valorEsperado =
    params.valorInicial + params.totalDinheiro - params.totalSangrias;
  return {
    valorEsperado,
    diferenca: params.valorInformado - valorEsperado,
  };
}
