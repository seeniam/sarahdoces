"use client";

import {
  Ban,
  CheckCircle2,
  ChefHat,
  HandPlatter,
  Receipt,
  Send,
} from "lucide-react";
import { cn } from "cn";
import { formatHora } from "@/lib/format";
import type { Comanda } from "@/types";

/** Linha do tempo de uma comanda: criada → enviada → pronta → (entregue) → paga. */
export function ComandaTimeline({
  comanda,
  nomeUsuario,
}: {
  comanda: Comanda;
  nomeUsuario: (id?: string) => string;
}) {
  const atendente = nomeUsuario(comanda.atendenteId);
  const cancelada = comanda.status === "cancelada";

  const etapas: { icone: typeof Send; titulo: string; data?: string; quem?: string }[] = [
    { icone: Receipt, titulo: "Criada", data: comanda.criadaEm, quem: atendente },
    { icone: Send, titulo: "Enviada à cozinha", data: comanda.enviadaEm, quem: atendente },
    { icone: ChefHat, titulo: "Pronta", data: comanda.prontaEm, quem: "Cozinha" },
    { icone: HandPlatter, titulo: "Entregue", data: comanda.entregueEm, quem: "Cozinha" },
    { icone: CheckCircle2, titulo: "Paga", data: comanda.pagaEm, quem: atendente },
  ].filter((e) => e.data);

  return (
    <ol className="space-y-0">
      {etapas.map((e, i) => {
        const Icone = e.icone;
        const ultimo = i === etapas.length - 1 && !cancelada;
        return (
          <li key={e.titulo} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border",
                  ultimo ? "border-pistache/40 bg-pistache/10 text-pistache" : "border-border text-muted-foreground",
                )}
              >
                <Icone className="size-4" />
              </span>
              {(i < etapas.length - 1 || cancelada) && (
                <span className="my-0.5 w-px flex-1 bg-border" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{e.titulo}</p>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {e.data ? formatHora(e.data) : ""}
                </p>
              </div>
              {e.quem && <p className="text-xs text-muted-foreground">{e.quem}</p>}
            </div>
          </li>
        );
      })}
      {cancelada && (
        <li className="flex gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-alerta/40 bg-alerta/10 text-alerta">
            <Ban className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-alerta">Cancelada</p>
            {comanda.motivoCancelamento && (
              <p className="text-xs text-muted-foreground">{comanda.motivoCancelamento}</p>
            )}
          </div>
        </li>
      )}
    </ol>
  );
}
