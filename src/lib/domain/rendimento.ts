/**
 * Calculadora de rendimento de proteína.
 * Ex.: 20 kg de carne crua × fator 0,65 → 13 kg prontos → 108 PFs de 120 g.
 */
export interface Rendimento {
  pesoCruKg: number;
  fator: number;
  pesoProntoKg: number;
  gramasPorPorcao: number;
  porcoes: number;
}

export function calcularRendimento(params: {
  pesoCruKg: number;
  fator: number;
  gramasPorPorcao: number;
}): Rendimento {
  const { pesoCruKg, fator, gramasPorPorcao } = params;
  const pesoProntoKg = pesoCruKg * fator;
  const porcoes =
    gramasPorPorcao > 0
      ? Math.floor((pesoProntoKg * 1000) / gramasPorPorcao)
      : 0;
  return { pesoCruKg, fator, pesoProntoKg, gramasPorPorcao, porcoes };
}
