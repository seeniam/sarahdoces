"use client";

import { ArrowRight, CalendarClock, MessageCircle, Pencil } from "lucide-react";
import { cn } from "cn";
import { FotoProduto } from "@/components/shared/FotoProduto";
import { Button } from "@/components/ui/button";
import { formatBRL, formatData, formatHora } from "@/lib/format";
import {
  COR_STATUS_ENCOMENDA,
  ROTULO_STATUS_ENCOMENDA,
  proximoStatus,
} from "./rotulos";
import { linkWhatsApp, resumoItens, saldoEncomenda, situacaoRetirada } from "./util";
import type { BancoMock, Encomenda } from "@/types";

export function EncomendaCard({
  encomenda,
  banco,
  agora,
  onAvancar,
  onEntregar,
  onEditar,
  compacto,
}: {
  encomenda: Encomenda;
  banco: BancoMock;
  agora: Date;
  onAvancar: (e: Encomenda) => void;
  onEntregar: (e: Encomenda) => void;
  onEditar: (e: Encomenda) => void;
  compacto?: boolean;
}) {
  const e = encomenda;
  const situacao = situacaoRetirada(e, agora);
  const saldo = saldoEncomenda(e);
  const primeiroProduto = e.itens.find((it) => it.produtoId);
  const foto = primeiroProduto
    ? banco.produtos.find((p) => p.id === primeiroProduto.produtoId)?.foto
    : null;
  const prox = proximoStatus(e.status);

  return (
    <div
      className={cn(
        "rounded-[16px] border bg-card p-3",
        situacao === "atrasada" ? "border-alerta/40" : "border-border",
      )}
    >
      <div className="flex gap-3">
        <FotoProduto
          src={foto}
          alt={e.cliente}
          aspecto="1:1"
          categoria="bolo"
          className="w-16 shrink-0"
          sizes="64px"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-medium text-foreground">{e.cliente}</p>
            {situacao && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  situacao === "hoje"
                    ? "bg-pistache/15 text-pistache"
                    : "bg-alerta/12 text-alerta",
                )}
              >
                {situacao === "hoje" ? "Retira hoje" : "Atrasada"}
              </span>
            )}
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="size-3" />
            {formatData(e.dataEntrega)} · {formatHora(e.dataEntrega)}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{resumoItens(e, banco)}</p>
        </div>
      </div>

      {!compacto && (
        <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-xs">
          <span className="text-muted-foreground">
            Sinal {formatBRL(e.sinal)} / {formatBRL(e.total)}
          </span>
          <span className={cn("tnum font-medium", saldo > 0 ? "text-foreground" : "text-pistache")}>
            {saldo > 0 ? `falta ${formatBRL(saldo)}` : "quitado"}
          </span>
        </div>
      )}
      {e.obs && !compacto && (
        <p className="mt-1.5 rounded-md bg-secondary/50 px-2 py-1 text-[11px] text-muted-foreground">
          {e.obs}
        </p>
      )}

      {/* Ações */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {e.status !== "entregue" && (
          <>
            {e.status === "pronta" ? (
              <Button
                size="sm"
                className="h-8 bg-cereja text-white hover:bg-cereja-calda"
                onClick={() => onEntregar(e)}
              >
                Entregar
              </Button>
            ) : (
              prox && (
                <Button size="sm" variant="outline" className="h-8" onClick={() => onAvancar(e)}>
                  {ROTULO_STATUS_ENCOMENDA[prox]}
                  <ArrowRight className="size-3.5" />
                </Button>
              )
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              render={<a href={linkWhatsApp(e)} target="_blank" rel="noopener noreferrer" />}
            >
              <MessageCircle className="size-3.5" />
              WhatsApp
            </Button>
          </>
        )}
        {e.status !== "entregue" && (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Editar encomenda"
            className="h-8"
            onClick={() => onEditar(e)}
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
        {e.status === "entregue" && (
          <span className={cn("ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground")}>
            <span className={cn("size-2 rounded-full", COR_STATUS_ENCOMENDA.entregue)} />
            Entregue
          </span>
        )}
      </div>
    </div>
  );
}
