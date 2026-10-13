import type {
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
  const mediaCancel = totalCancel / atendentes.length;

  const brutos = base.map((b) => b.cancelamentos * 3 + b.descontos * 2 + b.cortesias);
  const maxBruto = Math.max(1, ...brutos);

  const risco: RiscoAtendente[] = base.map((b, i) => {
    // Compara com a média dos DEMAIS atendentes ("3× mais que a média").
    const outros = atendentes.length > 1 ? (totalCancel - b.cancelamentos) / (atendentes.length - 1) : 0;
    const razao = outros > 0 ? b.cancelamentos / outros : b.cancelamentos > 0 ? 3 : 0;
    let explicacao: string;
    if (razao >= 1.8) {
      explicacao = `${b.u.nome} cancelou ${Math.round(razao)}× mais que a média da equipe.`;
    } else if (b.descontos >= 2 && b.descontos > mediaCancel) {
      explicacao = `${b.u.nome} aplicou ${b.descontos} descontos no período.`;
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
