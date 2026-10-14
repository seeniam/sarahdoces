"use client";

import { Clock, Flame, Check, PackageCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { PRODUTO_POR_ID } from "@/lib/mock/data";
import { formatHaMinutos } from "@/lib/format";
import type { Comanda, StatusComanda } from "@/types";

const TIPO_LABEL: Record<Comanda["tipo"], string> = {
  mesa: "Mesa",
  balcao: "Balcão",
  viagem: "Viagem",
};

/** Cor do cronômetro por faixa (PRD: verde <8, amarelo <15, vermelho >15). */
function faixaTempo(min: number) {
  if (min < 8) return "#5E7F36"; // pistache
  if (min < 15) return "#C98A2E"; // doce-de-leite
  return "#C8372D"; // alerta
}

export function KdsCartao({
  comanda,
  agora,
  onAvancar,
  onEntregue,
  destaque = false,
}: {
  comanda: Comanda;
  /** Instante atual em ms (relógio do board, atualizado periodicamente). */
  agora: number;
  onAvancar: (c: Comanda, proximo: StatusComanda) => void;
  onEntregue: (c: Comanda) => void;
  destaque?: boolean;
}) {
  const semMovimento = useReducedMotion();
  const pronta = comanda.status === "pronta";
  const base = new Date(comanda.enviadaEm ?? comanda.criadaEm).getTime();
  // Em "Prontos", o tempo conta desde que ficou pronto ("pronto há 3 min").
  const prontaBase = comanda.prontaEm ? new Date(comanda.prontaEm).getTime() : base;
  const minutos = Math.max(0, Math.floor((agora - base) / 60000));
  const minPronto = Math.max(0, Math.floor((agora - prontaBase) / 60000));
  const corLoja = comanda.lojaId === "loja-1" ? "bg-loja-1" : "bg-loja-2";

  const alvo =
    comanda.tipo === "mesa"
      ? `Mesa ${comanda.identificador}`.trim()
      : `${TIPO_LABEL[comanda.tipo]}${comanda.identificador ? ` · ${comanda.identificador}` : ""}`;

  const corTempo = faixaTempo(minutos);

  return (
    <motion.article
      layout={!semMovimento}
      initial={semMovimento ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={semMovimento ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "overflow-hidden rounded-[16px] bg-white text-[#2b1b18] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]",
        destaque && "ring-4 ring-doce-de-leite",
      )}
    >
      {/* Única cor da loja: a faixa do topo. */}
      <div className={cn("h-2 w-full", corLoja)} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Destino do prato em Gloock grande; nº da comanda menor ao lado. */}
            <div className="flex items-baseline gap-2">
              <h3 className="font-display text-3xl leading-none">{alvo}</h3>
              <span className="shrink-0 text-sm text-[#2b1b18]/45 tnum">
                #{String(comanda.numero).padStart(4, "0")}
              </span>
            </div>
          </div>

          {pronta ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-pistache/12 px-2.5 py-1 text-sm font-semibold text-pistache">
              <PackageCheck className="size-3.5" />
              pronto {formatHaMinutos(minPronto)}
            </span>
          ) : (
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold tnum"
              style={{ color: corTempo, backgroundColor: `${corTempo}1a` }}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: corTempo }} />
              <Clock className="size-3.5" />
              {minutos}m
            </span>
          )}
        </div>

        <ul className="mt-3 space-y-2 border-t border-[#2b1b18]/10 pt-3">
          {comanda.itens.map((it, i) => {
            const nome = PRODUTO_POR_ID.get(it.produtoId)?.nome ?? it.produtoId;
            return (
              <li key={i}>
                <div className="flex items-baseline gap-2">
                  {/* "1×": quantidade e "×" com o mesmo peso e cor (igual ao ticket). */}
                  <span className="flex items-baseline gap-0.5 leading-none">
                    <span className="font-display text-2xl tnum">{it.qtd}</span>
                    <span className="text-xl font-semibold">×</span>
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

        {/* Botão pela cor do PRÓXIMO estado. */}
        {comanda.status === "enviada" ? (
          <Button
            size="lg"
            className="mt-4 h-14 w-full bg-doce-de-leite text-base text-white hover:bg-doce-de-leite/90"
            onClick={() => onAvancar(comanda, "preparando")}
          >
            <Flame className="size-5" />
            Começar preparo
          </Button>
        ) : comanda.status === "preparando" ? (
          <Button
            size="lg"
            className="mt-4 h-14 w-full bg-pistache text-base text-white hover:bg-pistache/90"
            onClick={() => onAvancar(comanda, "pronta")}
          >
            <Check className="size-5" />
            Marcar pronto
          </Button>
        ) : (
          <Button
            size="lg"
            variant="outline"
            className="mt-4 h-14 w-full border-[#2b1b18]/15 bg-white text-base text-[#2b1b18] hover:bg-[#2b1b18]/5"
            onClick={() => onEntregue(comanda)}
          >
            <PackageCheck className="size-5" />
            Entregue
          </Button>
        )}
      </div>
    </motion.article>
  );
}
