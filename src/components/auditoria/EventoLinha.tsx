"use client";

import {
  Ban,
  BadgePercent,
  ClipboardCheck,
  Gift,
  Printer,
  Tag,
  TriangleAlert,
  Wallet,
  ArrowLeftRight,
  ArrowDownCircle,
  Users,
} from "lucide-react";
import { cn } from "cn";
import { ROTULO_TIPO_EVENTO, COR_SEVERIDADE } from "./rotulos";
import { formatBRLSinalado, formatData, formatHora } from "@/lib/format";
import type { BancoMock, EventoAuditoria, TipoEvento } from "@/types";

const ICONE: Record<TipoEvento, typeof Ban> = {
  cancelamento: Ban,
  desconto: BadgePercent,
  cortesia: Gift,
  reimpressao: Printer,
  caixa_diferenca: Wallet,
  contagem_divergencia: ClipboardCheck,
  preco_alterado: Tag,
  perda: TriangleAlert,
  transferencia: ArrowLeftRight,
  sangria: ArrowDownCircle,
  equipe: Users,
};

export function EventoLinha({
  evento,
  banco,
  onClick,
}: {
  evento: EventoAuditoria;
  banco: BancoMock;
  onClick: () => void;
}) {
  const Icone = ICONE[evento.tipo];
  const nomeUsuario =
    banco.usuarios.find((u) => u.id === evento.usuarioId)?.nome.split(" ")[0] ?? "—";
  const nomeLoja =
    banco.lojas.find((l) => l.id === evento.lojaId)?.nome.replace(/^Loja \d+\s*[—-]\s*/, "") ?? "";

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-3 rounded-[16px] border border-border bg-card p-3.5 text-left transition-colors hover:border-cereja/30"
      >
        <span className="relative mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
          <Icone className="size-4" />
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 size-2.5 rounded-full ring-2 ring-card",
              COR_SEVERIDADE[evento.severidade],
            )}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {ROTULO_TIPO_EVENTO[evento.tipo]}
            </p>
            {evento.valorImpacto != null && evento.valorImpacto !== 0 && (
              <span
                className={cn(
                  "shrink-0 tnum text-sm font-semibold",
                  evento.valorImpacto < 0 ? "text-alerta" : "text-pistache",
                )}
              >
                {formatBRLSinalado(evento.valorImpacto)}
              </span>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">{evento.descricao}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatData(evento.data)} · {formatHora(evento.data)} · {nomeUsuario}
            {nomeLoja ? ` · ${nomeLoja}` : ""}
          </p>
        </div>
      </button>
    </li>
  );
}
