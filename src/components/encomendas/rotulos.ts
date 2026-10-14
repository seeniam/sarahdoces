import type { StatusEncomenda } from "@/types";

export const STATUS_ENCOMENDA: StatusEncomenda[] = [
  "orcamento",
  "confirmada",
  "em_producao",
  "pronta",
  "entregue",
];

export const ROTULO_STATUS_ENCOMENDA: Record<StatusEncomenda, string> = {
  orcamento: "Orçamento",
  confirmada: "Confirmada",
  em_producao: "Em produção",
  pronta: "Pronta",
  entregue: "Entregue",
};

/** Cor da coluna/etiqueta por status. */
export const COR_STATUS_ENCOMENDA: Record<StatusEncomenda, string> = {
  orcamento: "bg-muted-foreground",
  confirmada: "bg-azulejo",
  em_producao: "bg-doce-de-leite",
  pronta: "bg-pistache",
  entregue: "bg-cereja",
};

export function proximoStatus(s: StatusEncomenda): StatusEncomenda | null {
  const i = STATUS_ENCOMENDA.indexOf(s);
  return i < STATUS_ENCOMENDA.length - 1 ? STATUS_ENCOMENDA[i + 1] : null;
}
