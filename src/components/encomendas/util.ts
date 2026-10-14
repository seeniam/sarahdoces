import { formatData } from "@/lib/format";
import type { BancoMock, Encomenda } from "@/types";

/** Saldo a receber (total − sinal). */
export function saldoEncomenda(e: Encomenda): number {
  return Number((e.total - e.sinal).toFixed(2));
}

/** Resumo textual dos itens ("Bolo 2 andares" ou "12× Bolo de pote · 30× Brigadeiro"). */
export function resumoItens(e: Encomenda, banco: BancoMock): string {
  const nome = (id?: string) => banco.produtos.find((p) => p.id === id)?.nome ?? "item";
  return e.itens
    .map((it) => (it.nomeLivre ? it.nomeLivre : `${it.qtd}× ${nome(it.produtoId)}`))
    .join(" · ");
}

export type SituacaoRetirada = "hoje" | "atrasada" | null;

/** "Retira hoje" / "atrasada" para encomendas ainda não entregues. */
export function situacaoRetirada(e: Encomenda, agora: Date): SituacaoRetirada {
  if (e.status === "entregue") return null;
  const hoje = formatData(agora.toISOString());
  const dia = formatData(e.dataEntrega);
  if (dia === hoje) return "hoje";
  if (new Date(e.dataEntrega).getTime() < agora.getTime()) return "atrasada";
  return null;
}

/** Mensagem pronta para o WhatsApp (wa.me). */
export function mensagemWhatsApp(e: Encomenda): string {
  const nome = e.cliente.split(" ")[0];
  if (e.status === "pronta" || e.status === "entregue") {
    return `Oi ${nome}, sua encomenda da Sarah Rangel está pronta! Pode retirar quando quiser. 🍒`;
  }
  return `Oi ${nome}, aqui é da Sarah Rangel sobre a sua encomenda. Tudo certo para a retirada em ${formatData(e.dataEntrega)}?`;
}

/** Link wa.me (só dígitos do número). */
export function linkWhatsApp(e: Encomenda): string {
  const digitos = e.whatsapp.replace(/\D/g, "");
  // Número nacional tem 10 (fixo) ou 11 (celular) dígitos; com o país, 12/13.
  // Decidir pelo tamanho evita confundir o DDD "55" com o código do Brasil.
  const num = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${num}?text=${encodeURIComponent(mensagemWhatsApp(e))}`;
}
