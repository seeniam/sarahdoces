"use client";

import { toast } from "sonner";
import { Printer } from "lucide-react";
import { cn } from "cn";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ComandaTimeline } from "./ComandaTimeline";
import { useDadosStore, useSessaoStore } from "@/lib/store";
import { formatBRL } from "@/lib/format";
import { rotuloTipoComanda } from "./rotulos";
import type { BancoMock, Comanda, FormaPagamento } from "@/types";

const ROTULO_FORMA_PAG: Record<FormaPagamento, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
};

export function ComandaDetalhe({
  comanda,
  banco,
  onClose,
  onReimprimir,
}: {
  comanda: Comanda | null;
  banco: BancoMock;
  onClose: () => void;
  /** Dispara o overlay de impressão no cliente da página. */
  onReimprimir: (comanda: Comanda, via: "cliente" | "cozinha") => void;
}) {
  const registrarReimpressao = useDadosStore((s) => s.registrarReimpressao);
  const usuarioAtual = useSessaoStore((s) => s.usuarioId);
  const nomeUsuario = (id?: string) =>
    banco.usuarios.find((u) => u.id === id)?.nome ?? "—";
  const nomeProduto = (id: string) =>
    banco.produtos.find((p) => p.id === id)?.nome ?? id;
  const pagamentos = comanda
    ? banco.pagamentos.filter((p) => p.comandaId === comanda.id)
    : [];

  function reimprimir(via: "cliente" | "cozinha") {
    if (!comanda) return;
    registrarReimpressao({
      comandaId: comanda.id,
      usuarioId: usuarioAtual ?? comanda.atendenteId,
      via,
    });
    onReimprimir(comanda, via);
    toast.success(`Reimpressão registrada (via ${via === "cozinha" ? "da cozinha" : "do cliente"})`);
  }

  const total = comanda
    ? comanda.itens
        .filter((it) => !it.cancelado)
        .reduce((s, it) => s + it.precoUnit * it.qtd, 0) - (comanda.desconto ?? 0)
    : 0;

  return (
    <Sheet open={comanda !== null} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {comanda && (
          <>
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle className="font-display text-xl">
                Comanda #{comanda.numero}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">
                {rotuloTipoComanda(comanda.tipo)} · {comanda.identificador} ·{" "}
                {nomeUsuario(comanda.atendenteId)}
              </p>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {/* Itens */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Itens
                </h3>
                <ul className="space-y-1.5">
                  {comanda.itens.map((it, i) => (
                    <li key={i} className="text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <span className={cn(it.cancelado && "text-muted-foreground line-through")}>
                          {it.qtd}× {nomeProduto(it.produtoId)}
                        </span>
                        <span
                          className={cn(
                            "tnum shrink-0",
                            it.cancelado ? "text-muted-foreground line-through" : "text-foreground",
                          )}
                        >
                          {formatBRL(it.precoUnit * it.qtd)}
                        </span>
                      </div>
                      {it.cancelado && (
                        <p className="text-[11px] text-alerta">
                          Cancelado · {nomeUsuario(it.canceladoPor)}
                          {it.motivoCancelamento ? ` · ${it.motivoCancelamento}` : ""}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                {comanda.desconto ? (
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm">
                    <span className="text-muted-foreground">
                      Desconto{comanda.descontoAutorizadoPor ? ` · ${nomeUsuario(comanda.descontoAutorizadoPor)}` : ""}
                    </span>
                    <span className="tnum text-alerta">− {formatBRL(comanda.desconto)}</span>
                  </div>
                ) : null}
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-semibold">
                  <span>Total</span>
                  <span className="tnum">{formatBRL(total)}</span>
                </div>
              </section>

              {/* Pagamento */}
              {pagamentos.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pagamento
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {pagamentos.map((p) => (
                      <li key={p.id} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{ROTULO_FORMA_PAG[p.forma]}</span>
                        <span className="tnum">{formatBRL(p.valor)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Linha do tempo */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Linha do tempo
                </h3>
                <ComandaTimeline comanda={comanda} nomeUsuario={nomeUsuario} />
              </section>
            </div>

            <div className="flex gap-2 border-t border-border px-5 py-4">
              <Button variant="outline" className="flex-1" onClick={() => reimprimir("cliente")}>
                <Printer className="size-4" />
                Via do cliente
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => reimprimir("cozinha")}>
                <Printer className="size-4" />
                Via da cozinha
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
