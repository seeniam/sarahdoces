import type { StatusComanda, TipoComanda } from "@/types";

export const ROTULO_STATUS_COMANDA: Record<StatusComanda, string> = {
  aberta: "Aberta",
  enviada: "Na fila",
  preparando: "Preparando",
  pronta: "Pronta",
  paga: "Paga",
  cancelada: "Cancelada",
};

export const ROTULO_TIPO_COMANDA: Record<TipoComanda, string> = {
  mesa: "Mesa",
  balcao: "Balcão",
  viagem: "Viagem",
};

export function rotuloTipoComanda(t: TipoComanda): string {
  return ROTULO_TIPO_COMANDA[t];
}

export const VARIANTE_STATUS_COMANDA: Record<StatusComanda, "ok" | "atencao" | "critico" | "info" | "neutro"> = {
  aberta: "neutro",
  enviada: "info",
  preparando: "atencao",
  pronta: "atencao",
  paga: "ok",
  cancelada: "critico",
};
