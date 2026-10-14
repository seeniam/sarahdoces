import type { Severidade, TipoEvento } from "@/types";

export const ROTULO_TIPO_EVENTO: Record<TipoEvento, string> = {
  cancelamento: "Cancelamento",
  desconto: "Desconto",
  cortesia: "Cortesia",
  reimpressao: "Reimpressão",
  caixa_diferenca: "Diferença de caixa",
  contagem_divergencia: "Divergência de contagem",
  preco_alterado: "Alteração de preço",
  perda: "Perda",
  transferencia: "Transferência",
  sangria: "Sangria",
};

export const ROTULO_SEVERIDADE: Record<Severidade, string> = {
  info: "Informação",
  atencao: "Atenção",
  critico: "Crítico",
};

export const COR_SEVERIDADE: Record<Severidade, string> = {
  info: "bg-muted-foreground",
  atencao: "bg-doce-de-leite",
  critico: "bg-alerta",
};

export const VARIANTE_SEVERIDADE: Record<Severidade, "info" | "atencao" | "critico"> = {
  info: "info",
  atencao: "atencao",
  critico: "critico",
};
