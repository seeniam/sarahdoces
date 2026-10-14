"use client";

import { Clock, Flame, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { PRODUTO_POR_ID } from "@/lib/mock/data";
import type { Comanda, StatusComanda } from "@/types";

const TIPO_LABEL: Record<Comanda["tipo"], string> = {
  mesa: "Mesa",
  balcao: "Balcão",
  viagem: "Viagem",
};

/** Cor do cronômetro por faixa (PRD: verde <8, amarelo <15, vermelho >15). */
function faixaTempo(min: number) {
  if (min < 8) return { cor: "#5E7F36", rotulo: "no tempo" }; // pistache
  if (min < 15) return { cor: "#C98A2E", rotulo: "atenção" }; // doce-de-leite
  return { cor: "#C8372D", rotulo: "atrasado" }; // alerta
}

export function KdsCartao({
  comanda,
  agora,
  onAvancar,
  destaque = false,
}: {
  comanda: Comanda;
  /** Instante atual em ms (relógio do board, atualizado periodicamente). */
  agora: number;
  onAvancar: (c: Comanda, proximo: StatusComanda) => void;
  destaque?: boolean;
}) {
  const semMovimento = useReducedMotion();
  const base = new Date(comanda.enviadaEm ?? comanda.criadaEm).getTime();
  // Em "Prontos", o cronômetro congela no momento em que ficou pronto.
  const fim =
    comanda.status === "pronta" && comanda.prontaEm
      ? new Date(comanda.prontaEm).getTime()
      : agora;
  const minutos = Math.max(0, Math.floor((fim - base) / 60000));
  const faixa = faixaTempo(minutos);
  const corLoja = comanda.lojaId === "loja-1" ? "bg-loja-1" : "bg-loja-2";
  const alvo = `${TIPO_LABEL[comanda.tipo]}${
    comanda.identificador ? ` ${comanda.identificador}` : ""
  }`;

  const proximo: StatusComanda | null =
    comanda.status === "enviada"
      ? "preparando"
      : comanda.status === "preparando"
        ? "pronta"
        : null;
  const rotuloBotao =
    comanda.status === "enviada"
      ? "Começar preparo"
      : comanda.status === "preparando"
        ? "Marcar pronto"
        : null;
  const IconeBotao = comanda.status === "enviada" ? Flame : Check;

  return (
    <motion.article
      layout={!semMovimento}
      initial={semMovimento ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={semMovimento ? undefined : { opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "overflow-hidden rounded-[16px] bg-white text-[#2b1b18] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]",
        destaque && "ring-4 ring-doce-de-leite",
      )}
    >
      <div className={cn("h-2 w-full", corLoja)} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-4xl leading-none tnum">
              #{String(comanda.numero).padStart(4, "0")}
            </p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-[#2b1b18]/70">
              {alvo}
            </p>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold tnum"
            style={{ color: faixa.cor, backgroundColor: `${faixa.cor}1a` }}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: faixa.cor }}
            />
            <Clock className="size-3.5" />
            {minutos}m
          </span>
        </div>

        <ul className="mt-3 space-y-2 border-t border-[#2b1b18]/10 pt-3">
          {comanda.itens.map((it, i) => {
            const nome = PRODUTO_POR_ID.get(it.produtoId)?.nome ?? it.produtoId;
            return (
              <li key={i}>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl leading-none tnum">
                    {it.qtd}×
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 text-lg font-semibold uppercase leading-tight",
                      it.cancelado && "text-[#2b1b18]/40 line-through",
                    )}
                  >
                    {nome}
                  </span>
                </div>
                {it.adicionais.length > 0 && !it.cancelado && (
                  <p className="pl-8 text-sm font-medium text-[#2b1b18]/70">
                    {it.adicionais.map((a) => `+ ${a.nome}`).join("  ")}
                  </p>
                )}
                {it.obs && !it.cancelado && (
                  <p className="ml-8 mt-1 inline-block rounded bg-acucar px-2 py-0.5 text-sm font-semibold text-cereja-calda">
                    {it.obs}
                  </p>
                )}
                {it.cancelado && (
                  <p className="pl-8 text-xs font-semibold text-alerta">
                    <span className="mr-1 inline-block size-1.5 rounded-full bg-alerta align-middle" />
                    Cancelado{it.motivoCancelamento ? ` · ${it.motivoCancelamento}` : ""}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {proximo && rotuloBotao ? (
          <Button
            size="lg"
            className="mt-4 h-14 w-full text-base"
            onClick={() => onAvancar(comanda, proximo)}
          >
            <IconeBotao className="size-5" />
            {rotuloBotao}
          </Button>
        ) : (
          <p className="mt-4 flex h-14 items-center justify-center rounded-[12px] bg-pistache/15 text-base font-semibold text-pistache">
            <Check className="mr-2 size-5" />
            Pronto para retirada
          </p>
        )}
      </div>
    </motion.article>
  );
}
