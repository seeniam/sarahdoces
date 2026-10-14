import type { LojaId, Perda, ProdutoId, UsuarioId, ISODate, MotivoPerda } from "@/types";

/**
 * Cria uma Perda de produto por cancelamento APÓS o preparo (o prato já foi
 * feito, então o insumo foi consumido e vira perda — não estorno). Função pura:
 * id/data vêm do chamador (store usa novoId/agoraISO).
 */
export function perdaPorCancelamento(args: {
  id: string;
  lojaId: LojaId;
  produtoId: ProdutoId;
  qtd: number;
  /** Custo unitário do produto (CMV da ficha). */
  custoUnit: number;
  usuarioId: UsuarioId;
  data: ISODate;
}): Perda {
  return {
    id: args.id,
    lojaId: args.lojaId,
    produtoId: args.produtoId,
    qtd: args.qtd,
    motivo: "cancelado_apos_preparo",
    custo: Number((args.custoUnit * args.qtd).toFixed(2)),
    usuarioId: args.usuarioId,
    data: args.data,
    foto: null,
  };
}

/** Rótulos legíveis dos motivos de perda (pt-BR). */
export const ROTULO_MOTIVO_PERDA: Record<MotivoPerda, string> = {
  estragou: "Estragou",
  azedou: "Azedou",
  queimou: "Queimou",
  preparado_a_mais: "Preparado a mais",
  caiu: "Caiu / derrubou",
  vencido: "Vencido",
  consumo_equipe: "Consumo da equipe",
  quebrou: "Quebrou",
  cancelado_apos_preparo: "Cancelado após preparo",
};
