/**
 * DRE simplificada em cascata, fechamento de caixa cego e fluxo de caixa.
 * Funções puras — recebem totais já agregados ou o banco inteiro.
 */
import type {
  BancoMock,
  Despesa,
  FormaContada,
  LojaId,
  SessaoCaixa,
  ValoresPorForma,
} from "@/types";

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
 * Fechamento cego (apenas dinheiro) — mantido para compatibilidade/seed.
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

export const FORMAS_CONTADAS: FormaContada[] = ["dinheiro", "debito", "credito"];
export const ROTULO_FORMA: Record<FormaContada, string> = {
  dinheiro: "Dinheiro",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
};

/** Rótulos de TODAS as formas de pagamento (inclui Pix). */
export const ROTULO_FORMA_PAGAMENTO: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
};

export interface FechamentoPorForma {
  esperado: ValoresPorForma;
  informado: ValoresPorForma;
  diferenca: ValoresPorForma;
  /** Soma das diferenças das três formas. */
  diferencaTotal: number;
}

/**
 * Fechamento cego POR FORMA (Fase 7). O dinheiro esperado já considera o troco
 * inicial, as sangrias (saem) e os suprimentos (entram). Débito/crédito são só
 * as vendas na forma (o que a maquininha reporta). Pix NÃO entra (confere pelo
 * banco). Diferença = informado − esperado; negativo = falta.
 */
export function fecharCaixaCegoPorForma(params: {
  valorInicial: number;
  vendas: ValoresPorForma; // vendas recebidas na sessão, por forma
  totalSangrias: number;
  totalSuprimentos: number;
  informado: ValoresPorForma;
}): FechamentoPorForma {
  const { valorInicial, vendas, totalSangrias, totalSuprimentos, informado } = params;
  const esperado: ValoresPorForma = {
    dinheiro: round2(valorInicial + vendas.dinheiro - totalSangrias + totalSuprimentos),
    debito: round2(vendas.debito),
    credito: round2(vendas.credito),
  };
  const diferenca: ValoresPorForma = {
    dinheiro: round2(informado.dinheiro - esperado.dinheiro),
    debito: round2(informado.debito - esperado.debito),
    credito: round2(informado.credito - esperado.credito),
  };
  return {
    esperado,
    informado,
    diferenca,
    diferencaTotal: round2(diferenca.dinheiro + diferenca.debito + diferenca.credito),
  };
}

function round2(n: number): number {
  return Number(n.toFixed(2));
}

/**
 * Vendas de uma sessão de caixa por forma de pagamento: pagamentos da loja/
 * atendente da sessão, entre a abertura e o fechamento (ou agora).
 */
export function vendasDaSessao(
  banco: BancoMock,
  sessao: SessaoCaixa,
  ate?: Date,
): ValoresPorForma {
  const abertura = new Date(sessao.abertura).getTime();
  const fim = sessao.fechamento
    ? new Date(sessao.fechamento).getTime()
    : (ate?.getTime() ?? Date.now());
  const atendenteDaComanda = new Map(
    banco.comandas.map((c) => [c.id, c.atendenteId]),
  );
  const vendas: ValoresPorForma = { dinheiro: 0, debito: 0, credito: 0 };
  for (const p of banco.pagamentos) {
    if (p.lojaId !== sessao.lojaId) continue;
    if (p.forma === "pix") continue; // Pix não entra no caixa físico
    if (atendenteDaComanda.get(p.comandaId) !== sessao.usuarioId) continue;
    const t = new Date(p.data).getTime();
    if (t < abertura || t > fim) continue;
    vendas[p.forma as FormaContada] += p.valor;
  }
  return {
    dinheiro: round2(vendas.dinheiro),
    debito: round2(vendas.debito),
    credito: round2(vendas.credito),
  };
}

// ----------------------------------------------------------------------------
// Contas a pagar
// ----------------------------------------------------------------------------
export type StatusConta = "paga" | "vencida" | "vence_em_breve" | "a_vencer";

const TRES_DIAS_MS = 3 * 24 * 60 * 60 * 1000;

/** Situação de uma despesa frente à data atual. */
export function statusConta(despesa: Despesa, agora: Date): StatusConta {
  if (despesa.pagoEm) return "paga";
  const venc = new Date(despesa.vencimento).getTime();
  const hoje = agora.getTime();
  if (venc < hoje) return "vencida";
  if (venc - hoje <= TRES_DIAS_MS) return "vence_em_breve";
  return "a_vencer";
}

export const ROTULO_STATUS_CONTA: Record<StatusConta, string> = {
  paga: "Paga",
  vencida: "Vencida",
  vence_em_breve: "Vence em breve",
  a_vencer: "A vencer",
};

export const ROTULO_CATEGORIA_DESPESA: Record<string, string> = {
  aluguel: "Aluguel",
  salarios: "Salários",
  energia: "Energia",
  agua: "Água",
  gas: "Gás",
  internet: "Internet",
  marketing: "Marketing",
  manutencao: "Manutenção",
  impostos: "Impostos",
  outros: "Outros",
};

// ----------------------------------------------------------------------------
// Fluxo de caixa (entradas × saídas por dia)
// ----------------------------------------------------------------------------
const TZ_FIN = "America/Fortaleza";
const fmtDiaFin = new Intl.DateTimeFormat("en-CA", { timeZone: TZ_FIN });
function diaChaveFin(iso: string): string {
  return fmtDiaFin.format(new Date(iso));
}

export interface PontoFluxo {
  dia: string; // YYYY-MM-DD
  entradas: number;
  saidas: number;
  /** entradas − saídas do dia. */
  resultado: number;
  /** saldo acumulado até o dia (dentro do período). */
  saldoAcumulado: number;
}

export interface ResumoFluxo {
  pontos: PontoFluxo[];
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
}

/**
 * Fluxo de caixa por dia num intervalo [de, ate]: entradas = pagamentos
 * (todas as formas), saídas = compras + despesas pagas. Com saldo acumulado.
 */
export function fluxoDeCaixa(
  banco: BancoMock,
  filtro: LojaId | "todas",
  de: Date,
  ate: Date,
): ResumoFluxo {
  const deMs = de.getTime();
  const ateMs = ate.getTime();
  const noFiltro = (lojaId: LojaId | undefined) =>
    filtro === "todas" || lojaId === filtro;
  const dentro = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= deMs && t <= ateMs;
  };

  const mapa = new Map<string, { entradas: number; saidas: number }>();
  const bucket = (dia: string) => {
    let b = mapa.get(dia);
    if (!b) {
      b = { entradas: 0, saidas: 0 };
      mapa.set(dia, b);
    }
    return b;
  };

  for (const p of banco.pagamentos) {
    if (!noFiltro(p.lojaId) || !dentro(p.data)) continue;
    bucket(diaChaveFin(p.data)).entradas += p.valor;
  }
  for (const c of banco.compras) {
    if (!noFiltro(c.lojaId) || !dentro(c.data)) continue;
    bucket(diaChaveFin(c.data)).saidas += c.total;
  }
  for (const d of banco.despesas) {
    if (!d.pagoEm || !dentro(d.pagoEm)) continue;
    // Despesa sem loja (ex.: folha, energia) é rateada entre as duas quando se
    // filtra uma loja — igual à DRE —, nunca descartada.
    if (filtro !== "todas" && d.lojaId && d.lojaId !== filtro) continue;
    const peso = filtro !== "todas" && !d.lojaId ? 0.5 : 1;
    bucket(diaChaveFin(d.pagoEm)).saidas += d.valor * peso;
  }

  const dias = [...mapa.keys()].sort();
  let saldoAcumulado = 0;
  let totalEntradas = 0;
  let totalSaidas = 0;
  const pontos: PontoFluxo[] = dias.map((dia) => {
    const b = mapa.get(dia)!;
    const resultado = b.entradas - b.saidas;
    saldoAcumulado += resultado;
    totalEntradas += b.entradas;
    totalSaidas += b.saidas;
    return {
      dia,
      entradas: round2(b.entradas),
      saidas: round2(b.saidas),
      resultado: round2(resultado),
      saldoAcumulado: round2(saldoAcumulado),
    };
  });

  return {
    pontos,
    totalEntradas: round2(totalEntradas),
    totalSaidas: round2(totalSaidas),
    saldo: round2(totalEntradas - totalSaidas),
  };
}
