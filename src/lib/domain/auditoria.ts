import type {
  BancoMock,
  EventoAuditoria,
  ISODate,
  LojaId,
  Perfil,
  Severidade,
  TipoEvento,
  Usuario,
  UsuarioId,
} from "@/types";

/** Ações sensíveis que exigem autorização (PIN de gerente/dona + motivo). */
const ACOES_COM_AUTORIZACAO = new Set<TipoEvento>([
  "cancelamento",
  "desconto",
  "cortesia",
  "preco_alterado",
]);

export function acaoExigeAutorizacao(tipo: TipoEvento): boolean {
  return ACOES_COM_AUTORIZACAO.has(tipo);
}

/** Só gerente e dona podem autorizar ações sensíveis. */
export function podeAutorizar(perfil: Perfil): boolean {
  return perfil === "gerente" || perfil === "dona";
}

const SEVERIDADE_PADRAO: Record<TipoEvento, Severidade> = {
  cancelamento: "atencao",
  desconto: "atencao",
  cortesia: "info",
  reimpressao: "info",
  caixa_diferenca: "critico",
  contagem_divergencia: "atencao",
  preco_alterado: "atencao",
  perda: "info",
  transferencia: "info",
  sangria: "info",
};

export interface NovoEvento {
  tipo: TipoEvento;
  lojaId: LojaId;
  usuarioId: UsuarioId;
  descricao: string;
  severidade?: Severidade;
  autorizadoPor?: UsuarioId;
  valorImpacto?: number;
  refId?: string;
}

/**
 * Cria um EventoAuditoria. Pura: o id e a data vêm do chamador (a store usa
 * hora atual + id gerado; o seed usa valores determinísticos).
 */
export function registrarEvento(
  dados: NovoEvento,
  id: string,
  data: ISODate,
): EventoAuditoria {
  return {
    id,
    data,
    tipo: dados.tipo,
    lojaId: dados.lojaId,
    usuarioId: dados.usuarioId,
    descricao: dados.descricao,
    severidade: dados.severidade ?? SEVERIDADE_PADRAO[dados.tipo],
    autorizadoPor: dados.autorizadoPor,
    valorImpacto: dados.valorImpacto,
    refId: dados.refId,
  };
}

export interface RiscoAtendente {
  usuarioId: UsuarioId;
  nome: string;
  lojaId: LojaId | null;
  cancelamentos: number;
  descontos: number;
  cortesias: number;
  valorImpacto: number;
  /** 0–100, relativo ao pior da equipe. */
  score: number;
  explicacao: string;
}

/**
 * Score de risco por atendente, com explicação em linguagem simples
 * (ex.: "Thiago cancelou 3× mais que a média da equipe").
 */
export function scoreDeRisco(
  eventos: EventoAuditoria[],
  usuarios: Usuario[],
): RiscoAtendente[] {
  const atendentes = usuarios.filter((u) => u.perfil === "atendente");
  if (atendentes.length === 0) return [];

  const base = atendentes.map((u) => {
    const meus = eventos.filter((e) => e.usuarioId === u.id);
    const cancelamentos = meus.filter((e) => e.tipo === "cancelamento").length;
    const descontos = meus.filter((e) => e.tipo === "desconto").length;
    const cortesias = meus.filter((e) => e.tipo === "cortesia").length;
    const valorImpacto = meus.reduce(
      (s, e) => s + Math.abs(e.valorImpacto ?? 0),
      0,
    );
    return { u, cancelamentos, descontos, cortesias, valorImpacto };
  });

  const totalCancel = base.reduce((s, b) => s + b.cancelamentos, 0);
  const totalDesc = base.reduce((s, b) => s + b.descontos, 0);
  const mediaDesconto = totalDesc / atendentes.length;

  const brutos = base.map((b) => b.cancelamentos * 3 + b.descontos * 2 + b.cortesias);
  const maxBruto = Math.max(1, ...brutos);

  const risco: RiscoAtendente[] = base.map((b, i) => {
    // Razão em relação à média dos DEMAIS atendentes (a frase diz exatamente isso).
    const outros = atendentes.length > 1 ? (totalCancel - b.cancelamentos) / (atendentes.length - 1) : 0;
    const razao = outros > 0 ? b.cancelamentos / outros : b.cancelamentos > 0 ? 3 : 0;
    let explicacao: string;
    if (razao >= 1.8) {
      explicacao = `${b.u.nome} cancelou ${Math.round(razao)}× mais que a média dos demais atendentes.`;
    } else if (b.descontos >= 2 && b.descontos > mediaDesconto) {
      explicacao = `${b.u.nome} aplicou ${b.descontos} descontos no período (acima da média).`;
    } else {
      explicacao = `${b.u.nome} está dentro da média da equipe.`;
    }
    return {
      usuarioId: b.u.id,
      nome: b.u.nome,
      lojaId: b.u.lojaId,
      cancelamentos: b.cancelamentos,
      descontos: b.descontos,
      cortesias: b.cortesias,
      valorImpacto: b.valorImpacto,
      score: Math.round((brutos[i] / maxBruto) * 100),
      explicacao,
    };
  });

  return risco.sort((a, b) => b.score - a.score);
}

// ----------------------------------------------------------------------------
// Pontos de atenção por pessoa (Fase 7 §10)
// ----------------------------------------------------------------------------
// IMPORTANTE: linguagem neutra. Nada de "suspeito", "fraude" ou "risco" no
// texto visível — a Sarah usa isso com funcionários reais. São indicadores
// vs. a média da equipe, não acusações.

export interface PontoAtencao {
  usuarioId: UsuarioId;
  nome: string;
  lojaId: LojaId | null;
  cancelamentos: number;
  descontos: number;
  cortesias: number;
  /** Fechamentos de caixa com diferença relevante (|dif| ≥ 15). */
  caixaDiferencas: number;
  /** Soma do impacto financeiro (R$) dos eventos da pessoa no período. */
  valorImpacto: number;
  /** 0–100, relativo ao maior indicador da equipe. */
  score: number;
  /** Frases curtas em linguagem simples (vs. a média da equipe). */
  observacoes: string[];
}

const DIFERENCA_CAIXA_RELEVANTE = 15;

/**
 * Pontos de atenção da equipe num período [de, ate]. Cruza cancelamentos,
 * descontos e diferenças de caixa de cada atendente com a média dos demais.
 */
export function pontosDeAtencao(
  banco: BancoMock,
  de: Date,
  ate: Date,
): PontoAtencao[] {
  const deMs = de.getTime();
  const ateMs = ate.getTime();
  const noPeriodo = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= deMs && t <= ateMs;
  };
  const atendentes = banco.usuarios.filter((u) => u.perfil === "atendente");
  if (atendentes.length === 0) return [];

  const base = atendentes.map((u) => {
    const meus = banco.eventos.filter(
      (e) => e.usuarioId === u.id && noPeriodo(e.data),
    );
    const cancelamentos = meus.filter((e) => e.tipo === "cancelamento").length;
    const descontos = meus.filter((e) => e.tipo === "desconto").length;
    const cortesias = meus.filter((e) => e.tipo === "cortesia").length;
    const caixaDiferencas = banco.sessoesCaixa.filter(
      (s) =>
        s.usuarioId === u.id &&
        s.fechamento &&
        noPeriodo(s.fechamento) &&
        Math.abs(s.diferenca ?? 0) >= DIFERENCA_CAIXA_RELEVANTE,
    ).length;
    const valorImpacto = meus.reduce((s, e) => s + Math.abs(e.valorImpacto ?? 0), 0);
    return { u, cancelamentos, descontos, cortesias, caixaDiferencas, valorImpacto };
  });

  const totalCancel = base.reduce((s, b) => s + b.cancelamentos, 0);
  const totalDesc = base.reduce((s, b) => s + b.descontos, 0);
  const n = atendentes.length;

  // "Pesos" só para ordenar/pontuar (não é nota de risco exibida como tal).
  const brutos = base.map(
    (b) => b.cancelamentos * 3 + b.descontos * 2 + b.cortesias + b.caixaDiferencas * 4,
  );
  const maxBruto = Math.max(1, ...brutos);

  const resultado: PontoAtencao[] = base.map((b, i) => {
    const observacoes: string[] = [];
    const mediaOutrosCancel = n > 1 ? (totalCancel - b.cancelamentos) / (n - 1) : 0;
    const mediaOutrosDesc = n > 1 ? (totalDesc - b.descontos) / (n - 1) : 0;
    const razaoCancel =
      mediaOutrosCancel > 0
        ? b.cancelamentos / mediaOutrosCancel
        : b.cancelamentos > 0
          ? 3
          : 0;

    if (razaoCancel >= 1.8 && b.cancelamentos >= 3) {
      observacoes.push(
        `Cancelou ${b.cancelamentos} ${b.cancelamentos === 1 ? "item" : "itens"} no período — cerca de ${Math.round(razaoCancel)}× a média da equipe.`,
      );
    }
    if (b.descontos >= 2 && b.descontos > mediaOutrosDesc * 1.5) {
      observacoes.push(
        `Aplicou ${b.descontos} descontos — acima da média da equipe.`,
      );
    }
    if (b.caixaDiferencas >= 1) {
      observacoes.push(
        `Teve ${b.caixaDiferencas} ${b.caixaDiferencas === 1 ? "fechamento de caixa" : "fechamentos de caixa"} com diferença relevante.`,
      );
    }
    if (observacoes.length === 0) {
      observacoes.push("Dentro da média da equipe no período.");
    }

    return {
      usuarioId: b.u.id,
      nome: b.u.nome,
      lojaId: b.u.lojaId,
      cancelamentos: b.cancelamentos,
      descontos: b.descontos,
      cortesias: b.cortesias,
      caixaDiferencas: b.caixaDiferencas,
      valorImpacto: b.valorImpacto,
      score: Math.round((brutos[i] / maxBruto) * 100),
      observacoes,
    };
  });

  return resultado.sort((a, b) => b.score - a.score);
}
