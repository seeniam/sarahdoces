"use client";

import { ArrowRight, Lock } from "lucide-react";
import { cn } from "cn";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ROTULO_TIPO_EVENTO, ROTULO_SEVERIDADE, VARIANTE_SEVERIDADE } from "./rotulos";
import { formatBRLSinalado, formatData, formatHora } from "@/lib/format";
import type { BancoMock, EventoAuditoria } from "@/types";

export function EventoDetalhe({
  evento,
  banco,
  onClose,
}: {
  evento: EventoAuditoria | null;
  banco: BancoMock;
  onClose: () => void;
}) {
  const nomeUsuario = (id?: string) =>
    banco.usuarios.find((u) => u.id === id)?.nome ?? "—";
  const nomeLoja = (id?: string) =>
    banco.lojas.find((l) => l.id === id)?.nome.replace(/^Loja \d+\s*[—-]\s*/, "") ?? "—";
  const comanda = evento?.refId
    ? banco.comandas.find((c) => c.id === evento.refId)
    : undefined;

  return (
    <Sheet open={evento !== null} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {evento && (
          <>
            <SheetHeader className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <SheetTitle className="font-display text-xl">
                  {ROTULO_TIPO_EVENTO[evento.tipo]}
                </SheetTitle>
                <StatusBadge variante={VARIANTE_SEVERIDADE[evento.severidade]}>
                  {ROTULO_SEVERIDADE[evento.severidade]}
                </StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground">{evento.descricao}</p>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-5 py-4">
              <Linha rotulo="Quando" valor={`${formatData(evento.data)} · ${formatHora(evento.data)}`} />
              <Linha rotulo="Onde" valor={nomeLoja(evento.lojaId)} />
              <Linha rotulo="Quem fez" valor={nomeUsuario(evento.usuarioId)} />
              {evento.autorizadoPor && (
                <Linha rotulo="Autorizado por" valor={nomeUsuario(evento.autorizadoPor)} />
              )}
              {evento.antes && evento.depois && (
                <div className="flex items-center justify-between gap-3 border-b border-border py-2.5">
                  <span className="text-sm text-muted-foreground">Antes → depois</span>
                  <AntesDepois antes={evento.antes} depois={evento.depois} />
                </div>
              )}
              {evento.valorImpacto != null && evento.valorImpacto !== 0 && (
                <Linha
                  rotulo="Valor impactado"
                  valor={formatBRLSinalado(evento.valorImpacto)}
                  classe={evento.valorImpacto < 0 ? "text-alerta" : "text-pistache"}
                />
              )}
              {comanda && (
                <Linha rotulo="Comanda" valor={`#${comanda.numero}`} />
              )}

              <p className="mt-4 flex items-center gap-2 rounded-[12px] border border-border bg-secondary/40 px-3 py-2.5 text-xs text-muted-foreground">
                <Lock className="size-3.5 shrink-0" />
                Registro de auditoria — não pode ser alterado nem apagado.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Linha({
  rotulo,
  valor,
  classe,
}: {
  rotulo: string;
  valor: string;
  classe?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{rotulo}</span>
      <span className={cn("tnum text-right text-sm font-medium text-foreground", classe)}>
        {valor}
      </span>
    </div>
  );
}

/** Antes → depois (para alteração de preço, Fase 8). Exportado para reuso. */
export function AntesDepois({ antes, depois }: { antes: string; depois: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 tnum">
      <span className="text-muted-foreground line-through">{antes}</span>
      <ArrowRight className="size-3.5 text-muted-foreground" />
      <span className="font-medium">{depois}</span>
    </span>
  );
}
