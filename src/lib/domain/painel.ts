/**
 * Métricas do Painel da Dona — funções PURAS sobre o BancoMock.
 * Regras (decisões do arquiteto):
 * - Comparação justa: "hoje até agora" vs "mesmo dia da semana passada até o
 *   mesmo horário". 7/30 dias comparam com o período imediatamente anterior.
 * - Itens cancelados ficam fora do faturamento; descontos são linha própria.
 * - Lucro estimado = faturamento − CMV − perdas − despesas (fixas rateadas/dia).
 */
import type {
  BancoMock,
  Comanda,
  FormaPagamento,
  LojaId,
  Produto,
} from "@/types";
import { calcularDRE, type DRE } from "./financeiro";
import { scoreDeRisco } from "./auditoria";
import { formatBRL, formatQuantidade } from "@/lib/format";

export type Periodo = "hoje" | "7dias" | "30dias";
export type LojaFiltro = LojaId | "todas";

const DIA_MS = 86_400_000;
const TZ_OFFSET = "-03:00"; // São Luís / Fortaleza

// --- Tempo no fuso de São Luís ---
function ymdFortaleza(d: Date): { ano: number; mes: number; dia: number } {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const num = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return { ano: num("year"), mes: num("month"), dia: num("day") };
}
/** Início do dia (00:00 São Luís) de uma data, em ms. */
function inicioDiaMs(d: Date): number {
  const { ano, mes, dia } = ymdFortaleza(d);
  return new Date(
    `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}T00:00:00${TZ_OFFSET}`,
  ).getTime();
}

export interface Janela {
  inicio: number;
  fim: number;
}
export interface Janelas {
  atual: Janela;
  comparacao: Janela;
  /** Rótulo da comparação ("terça passada", "7 dias anteriores"). */
  rotuloComparacao: string;
  dias: number;
}

const DIAS_SEMANA = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

/** Calcula as janelas (atual + comparação justa) para o período. */
export function janelasDoPeriodo(periodo: Periodo, agora: Date): Janelas {
  const fim = agora.getTime();
  if (periodo === "hoje") {
    const inicioHoje = inicioDiaMs(agora);
    const decorrido = fim - inicioHoje;
    const inicioComp = inicioHoje - 7 * DIA_MS;
    // Dia da semana de "hoje" (em São Luís) para o rótulo da comparação.
    const { ano, mes, dia } = ymdFortaleza(agora);
    const w = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
    return {
      atual: { inicio: inicioHoje, fim },
      comparacao: { inicio: inicioComp, fim: inicioComp + decorrido },
      rotuloComparacao: `${DIAS_SEMANA[w]} passada`,
      dias: 1,
    };
  }
  const n = periodo === "7dias" ? 7 : 30;
  const inicio = fim - n * DIA_MS;
  return {
    atual: { inicio, fim },
    comparacao: { inicio: inicio - n * DIA_MS, fim: inicio },
    rotuloComparacao: `${n} dias anteriores`,
    dias: n,
  };
}

// --- Helpers de comanda ---
function noFiltro(lojaId: LojaId, filtro: LojaFiltro): boolean {
  return filtro === "todas" || lojaId === filtro;
}
/** Faturamento de uma comanda: itens ativos − desconto (nunca negativo). */
export function faturamentoDeComanda(c: Comanda): number {
  const sub = c.itens.reduce(
    (s, it) => s + (it.cancelado ? 0 : it.precoUnit * it.qtd),
    0,
  );
  return Math.max(0, sub - (c.desconto ?? 0));
}
function cmvDeComanda(c: Comanda, custoPorProduto: Map<string, number>): number {
  return c.itens.reduce(
    (s, it) => s + (it.cancelado ? 0 : (custoPorProduto.get(it.produtoId) ?? 0) * it.qtd),
    0,
  );
}
function emJanela(iso: string | undefined, j: Janela): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= j.inicio && t <= j.fim;
}

export interface ResumoVendas {
  faturamento: number;
  pedidos: number;
  ticketMedio: number;
}
function resumoVendas(
  comandas: Comanda[],
  filtro: LojaFiltro,
  j: Janela,
): ResumoVendas {
  let faturamento = 0;
  let pedidos = 0;
  for (const c of comandas) {
    if (c.status !== "paga" || !noFiltro(c.lojaId, filtro)) continue;
    if (!emJanela(c.pagaEm, j)) continue;
    faturamento += faturamentoDeComanda(c);
    pedidos += 1;
  }
  return {
    faturamento,
    pedidos,
    ticketMedio: pedidos > 0 ? faturamento / pedidos : 0,
  };
}

export interface MetricasPainel {
  periodo: Periodo;
  rotuloComparacao: string;
  faturamento: number;
  pedidos: number;
  ticketMedio: number;
  descontos: number;
  dre: DRE; // faturamento, cmv, perdas, despesas, lucro, margem
  tempoMedioPreparoMin: number | null;
  /** Variação % vs comparação (0.12 = +12%). null quando a base é 0. */
  variacao: {
    faturamento: number | null;
    pedidos: number | null;
    ticketMedio: number | null;
  };
}

/** Todas as métricas-chave do período. */
export function metricasPainel(
  banco: BancoMock,
  filtro: LojaFiltro,
  periodo: Periodo,
  agora: Date,
): MetricasPainel {
  const j = janelasDoPeriodo(periodo, agora);
  const custoPorProduto = new Map(banco.produtos.map((p) => [p.id, p.custo]));

  const atual = resumoVendas(banco.comandas, filtro, j.atual);
  const comp = resumoVendas(banco.comandas, filtro, j.comparacao);

  let descontos = 0;
  let cmv = 0;
  let somaPreparo = 0;
  let nPreparo = 0;
  for (const c of banco.comandas) {
    if (c.status !== "paga" || !noFiltro(c.lojaId, filtro)) continue;
    if (!emJanela(c.pagaEm, j.atual)) continue;
    descontos += c.desconto ?? 0;
    cmv += cmvDeComanda(c, custoPorProduto);
    if (c.enviadaEm && c.prontaEm) {
      somaPreparo +=
        (new Date(c.prontaEm).getTime() - new Date(c.enviadaEm).getTime()) /
        60000;
      nPreparo += 1;
    }
  }

  const perdas = banco.perdas.reduce(
    (s, p) => (noFiltro(p.lojaId, filtro) && emJanela(p.data, j.atual) ? s + p.custo : s),
    0,
  );
  const despesas = despesasDoPeriodo(banco, filtro, j.dias);
  const dre = calcularDRE({ faturamento: atual.faturamento, cmv, perdas, despesas });

  const varia = (a: number, b: number): number | null =>
    b > 0 ? (a - b) / b : null;

  return {
    periodo,
    rotuloComparacao: j.rotuloComparacao,
    faturamento: atual.faturamento,
    pedidos: atual.pedidos,
    ticketMedio: atual.ticketMedio,
    descontos,
    dre,
    tempoMedioPreparoMin: nPreparo > 0 ? Math.round(somaPreparo / nPreparo) : null,
    variacao: {
      faturamento: varia(atual.faturamento, comp.faturamento),
      pedidos: varia(atual.pedidos, comp.pedidos),
      ticketMedio: varia(atual.ticketMedio, comp.ticketMedio),
    },
  };
}

/** Despesas fixas rateadas por dia × dias do período (estimativa). */
export function despesasDoPeriodo(
  banco: BancoMock,
  filtro: LojaFiltro,
  dias: number,
): number {
  let mensal = 0;
  for (const d of banco.despesas) {
    if (filtro !== "todas") {
      if (d.lojaId && d.lojaId !== filtro) continue;
      mensal += d.lojaId ? d.valor : d.valor / 2; // sem loja = rateio entre as 2
    } else {
      mensal += d.valor;
    }
  }
  return (mensal / 30) * dias;
}

// --- Gráficos ---
export interface PontoHora {
  hora: number;
  /** null nas horas futuras (a área para na hora atual, sem cair a zero). */
  hoje: number | null;
  media: number;
}
/** Faturamento por hora de hoje + média das últimas 4 semanas no mesmo dia. */
export function vendasPorHora(
  banco: BancoMock,
  filtro: LojaFiltro,
  agora: Date,
): PontoHora[] {
  const inicioHoje = inicioDiaMs(agora);
  const horasHoje = new Array(24).fill(0);
  const horasHist: number[][] = Array.from({ length: 4 }, () => new Array(24).fill(0));
  const horaFortaleza = (iso: string) =>
    Number(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Fortaleza",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(new Date(iso)),
    );

  for (const c of banco.comandas) {
    if (c.status !== "paga" || !noFiltro(c.lojaId, filtro) || !c.pagaEm) continue;
    const t = new Date(c.pagaEm).getTime();
    const h = horaFortaleza(c.pagaEm);
    const val = faturamentoDeComanda(c);
    if (t >= inicioHoje) {
      horasHoje[h] += val;
    } else {
      for (let s = 1; s <= 4; s++) {
        const ini = inicioHoje - s * 7 * DIA_MS;
        if (t >= ini && t < ini + DIA_MS) horasHist[s - 1][h] += val;
      }
    }
  }
  const HORAS = Array.from({ length: 18 }, (_, i) => i + 6); // 6h–23h
  const agoraH = horaFortaleza(agora.toISOString());
  return HORAS.map((h) => {
    const media =
      horasHist.reduce((s, dia) => s + dia[h], 0) / horasHist.length;
    return { hora: h, hoje: h <= agoraH ? horasHoje[h] : null, media };
  });
}

export interface VendaLoja {
  lojaId: LojaId;
  faturamento: number;
}
export function faturamentoPorLoja(
  banco: BancoMock,
  periodo: Periodo,
  agora: Date,
): VendaLoja[] {
  const j = janelasDoPeriodo(periodo, agora).atual;
  return (["loja-1", "loja-2"] as LojaId[]).map((lojaId) => ({
    lojaId,
    faturamento: resumoVendas(banco.comandas, lojaId, j).faturamento,
  }));
}

export interface TopProduto {
  produto: Produto;
  valor: number;
  qtd: number;
}
export function topProdutos(
  banco: BancoMock,
  filtro: LojaFiltro,
  periodo: Periodo,
  agora: Date,
  n = 5,
): TopProduto[] {
  const j = janelasDoPeriodo(periodo, agora).atual;
  const porProduto = new Map<string, { valor: number; qtd: number }>();
  for (const c of banco.comandas) {
    if (c.status !== "paga" || !noFiltro(c.lojaId, filtro) || !emJanela(c.pagaEm, j))
      continue;
    for (const it of c.itens) {
      if (it.cancelado) continue;
      const cur = porProduto.get(it.produtoId) ?? { valor: 0, qtd: 0 };
      cur.valor += it.precoUnit * it.qtd;
      cur.qtd += it.qtd;
      porProduto.set(it.produtoId, cur);
    }
  }
  const prodById = new Map(banco.produtos.map((p) => [p.id, p]));
  return [...porProduto.entries()]
    .map(([id, v]) => ({ produto: prodById.get(id)!, valor: v.valor, qtd: v.qtd }))
    .filter((x) => x.produto)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, n);
}

export interface FatiaPagamento {
  forma: FormaPagamento;
  valor: number;
  fracao: number;
}
export function formasPagamento(
  banco: BancoMock,
  filtro: LojaFiltro,
  periodo: Periodo,
  agora: Date,
): FatiaPagamento[] {
  const j = janelasDoPeriodo(periodo, agora).atual;
  const soma: Record<FormaPagamento, number> = { pix: 0, dinheiro: 0, debito: 0, credito: 0 };
  let total = 0;
  for (const p of banco.pagamentos) {
    if (!noFiltro(p.lojaId, filtro) || !emJanela(p.data, j)) continue;
    soma[p.forma] += p.valor;
    total += p.valor;
  }
  return (["pix", "dinheiro", "debito", "credito"] as FormaPagamento[]).map(
    (forma) => ({ forma, valor: soma[forma], fracao: total > 0 ? soma[forma] / total : 0 }),
  );
}

export interface PontoVendaPerda {
  dia: string; // YYYY-MM-DD (São Luís)
  venda: number;
  perda: number;
}
/** Venda × Perda por dia nos últimos N dias (default 14). */
export function vendaXPerda(
  banco: BancoMock,
  filtro: LojaFiltro,
  agora: Date,
  n = 14,
): PontoVendaPerda[] {
  const diaDe = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(
      new Date(iso),
    );
  const hoje0 = inicioDiaMs(agora);
  const dias: string[] = [];
  const mapa = new Map<string, { venda: number; perda: number }>();
  for (let i = n - 1; i >= 0; i--) {
    const dia = diaDe(new Date(hoje0 - i * DIA_MS).toISOString());
    dias.push(dia);
    mapa.set(dia, { venda: 0, perda: 0 });
  }
  for (const c of banco.comandas) {
    if (c.status !== "paga" || !noFiltro(c.lojaId, filtro) || !c.pagaEm) continue;
    const e = mapa.get(diaDe(c.pagaEm));
    if (e) e.venda += faturamentoDeComanda(c);
  }
  const fimMs = agora.getTime();
  for (const p of banco.perdas) {
    if (!noFiltro(p.lojaId, filtro)) continue;
    if (new Date(p.data).getTime() > fimMs) continue; // painel nunca vê o futuro
    const e = mapa.get(diaDe(p.data));
    if (e) e.perda += p.custo;
  }
  return dias.map((dia) => ({ dia, ...mapa.get(dia)! }));
}

// --- Alertas do "Olho da Dona" ---
export type Severidade = "info" | "atencao" | "critico";
export interface AlertaPainel {
  id: string;
  severidade: Severidade;
  texto: string;
  href: string;
}

/** Até 3 alertas concretos (valor + pessoa), por severidade. */
export function alertasPainel(
  banco: BancoMock,
  filtro: LojaFiltro,
  agora: Date,
): AlertaPainel[] {
  const alertas: AlertaPainel[] = [];
  const fim = agora.getTime();
  const seteDias = fim - 7 * DIA_MS;
  const nomeLoja = (id: LojaId) =>
    banco.lojas.find((l) => l.id === id)?.nome.replace(/^Loja \d+\s*[—-]\s*/, "") ?? "";
  const brl = (v: number) => formatBRL(Math.abs(v));

  // 1) Atendente com cancelamentos acima da média (score de risco).
  const eventosSemana = banco.eventos.filter(
    (e) =>
      noFiltro(e.lojaId, filtro) && new Date(e.data).getTime() >= seteDias,
  );
  const risco = scoreDeRisco(eventosSemana, banco.usuarios);
  const topo = risco[0];
  if (topo && topo.cancelamentos >= 3) {
    alertas.push({
      id: "risco-cancelamento",
      severidade: "atencao",
      texto: `${topo.nome} cancelou ${topo.cancelamentos} itens esta semana — ${topo.explicacao.replace(/^.*?cancelou /, "").replace(`${topo.nome} `, "")} (${brl(topo.valorImpacto)})`,
      href: "/auditoria",
    });
  }

  // 2) Divergência de insumo "sem explicação" (última contagem).
  for (const cont of banco.contagens) {
    if (!noFiltro(cont.lojaId, filtro)) continue;
    const pior = [...cont.itens].sort((a, b) => a.diferenca - b.diferenca)[0];
    if (pior && pior.diferenca <= -1) {
      const insumo = banco.insumos.find((i) => i.id === pior.insumoId);
      const custo = (insumo?.custoMedio ?? 0) * Math.abs(pior.diferenca);
      alertas.push({
        id: `divergencia-${cont.lojaId}`,
        severidade: "critico",
        texto: `${insumo?.nome ?? "Insumo"}: ${formatQuantidade(Math.abs(pior.diferenca), insumo?.unidade ?? "")} sem explicação em ${nomeLoja(cont.lojaId)} (${brl(custo)})`,
        href: "/estoque",
      });
      break;
    }
  }

  // 3) Caixa fechado com diferença relevante.
  const caixaRuim = banco.sessoesCaixa
    .filter(
      (s) =>
        noFiltro(s.lojaId, filtro) &&
        s.fechamento &&
        Math.abs(s.diferenca ?? 0) >= 15,
    )
    .sort(
      (a, b) =>
        new Date(b.fechamento!).getTime() - new Date(a.fechamento!).getTime(),
    )[0];
  if (caixaRuim) {
    const sinal = (caixaRuim.diferenca ?? 0) < 0 ? "−" : "+";
    alertas.push({
      id: "caixa-diferenca",
      severidade: "critico",
      texto: `Caixa da ${nomeLoja(caixaRuim.lojaId)} fechou com ${sinal}${brl(caixaRuim.diferenca ?? 0)}`,
      href: "/financeiro",
    });
  }

  const ordem: Record<Severidade, number> = { critico: 0, atencao: 1, info: 2 };
  return alertas.sort((a, b) => ordem[a.severidade] - ordem[b.severidade]);
}
