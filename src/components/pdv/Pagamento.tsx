"use client";

import { useState } from "react";
import { Banknote, CreditCard, QrCode, SplitSquareHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import { formatBRL } from "@/lib/format";
import type { FormaPagamento } from "@/types";

export interface PagamentoFeito {
  forma: FormaPagamento;
  valor: number;
  troco?: number;
}

const FORMAS: { id: FormaPagamento | "misto"; label: string; icone: typeof QrCode }[] = [
  { id: "pix", label: "Pix", icone: QrCode },
  { id: "dinheiro", label: "Dinheiro", icone: Banknote },
  { id: "debito", label: "Débito", icone: CreditCard },
  { id: "credito", label: "Crédito", icone: CreditCard },
  { id: "misto", label: "Misto", icone: SplitSquareHorizontal },
];

export function Pagamento({
  aberto,
  onOpenChange,
  total,
  onConfirmar,
}: {
  aberto: boolean;
  onOpenChange: (o: boolean) => void;
  total: number;
  onConfirmar: (pagamentos: PagamentoFeito[]) => void;
}) {
  const [forma, setForma] = useState<FormaPagamento | "misto">("pix");
  const [recebido, setRecebido] = useState(total);
  const [dinheiroMisto, setDinheiroMisto] = useState(Math.floor(total / 2));

  const troco = Math.max(0, recebido - total);
  const restanteMisto = Math.max(0, total - dinheiroMisto);

  function confirmar() {
    if (forma === "dinheiro") {
      onConfirmar([{ forma: "dinheiro", valor: total, troco: troco || undefined }]);
    } else if (forma === "misto") {
      onConfirmar([
        { forma: "dinheiro", valor: dinheiroMisto },
        { forma: "debito", valor: restanteMisto },
      ]);
    } else {
      onConfirmar([{ forma, valor: total }]);
    }
  }

  const podeConfirmar =
    forma === "dinheiro" ? recebido >= total : forma === "misto" ? dinheiroMisto > 0 && dinheiroMisto < total : true;

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Receber pagamento</DialogTitle>
          <DialogDescription>
            Total a receber:{" "}
            <span className="font-semibold text-foreground tnum">
              {formatBRL(total)}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Formas */}
        <div className="grid grid-cols-5 gap-1.5">
          {FORMAS.map((f) => {
            const Icone = f.icone;
            const on = forma === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setForma(f.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[12px] border px-1 py-2.5 text-[11px] font-medium transition-colors",
                  on
                    ? "border-cereja bg-acucar/60 text-cereja"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                <Icone className="size-5" />
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-44 pt-1">
          {forma === "pix" && (
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="relative grid size-40 place-items-center overflow-hidden rounded-[14px] border border-border bg-white">
                <QrCode className="size-28 text-[#161616]" strokeWidth={1} />
                {/* Selo discreto: deixa claro que o QR é da demonstração. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-[18deg] bg-black/[0.04] py-0.5 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-black/35"
                >
                  Demonstração
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Aponte a câmera para o QR. Pix direto na conta da empresa.
              </p>
            </div>
          )}

          {forma === "dinheiro" && (
            <div className="space-y-3 py-2">
              <label className="block text-sm font-medium text-foreground">
                Valor recebido
              </label>
              <Input
                type="number"
                inputMode="decimal"
                value={recebido}
                min={0}
                onChange={(e) => setRecebido(Number(e.target.value) || 0)}
                className="h-12 text-lg tnum"
              />
              <div className="flex flex-wrap gap-2">
                {[total, 50, 100, 200]
                  .filter((v, i, a) => a.indexOf(v) === i && v >= total)
                  .map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRecebido(v)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
                    >
                      {v === total ? "Valor exato" : formatBRL(v)}
                    </button>
                  ))}
              </div>
              <div className="flex items-center justify-between rounded-[12px] bg-muted px-4 py-3">
                <span className="text-sm text-muted-foreground">Troco</span>
                <span className="font-display text-xl text-foreground tnum">
                  {formatBRL(troco)}
                </span>
              </div>
            </div>
          )}

          {(forma === "debito" || forma === "credito") && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CreditCard className="size-12 text-cereja" strokeWidth={1.25} />
              <p className="text-sm text-muted-foreground">
                Insira ou aproxime o cartão na maquininha e confirme o valor.
              </p>
            </div>
          )}

          {forma === "misto" && (
            <div className="space-y-3 py-2">
              <label className="block text-sm font-medium text-foreground">
                Parte em dinheiro
              </label>
              <Input
                type="number"
                inputMode="decimal"
                value={dinheiroMisto}
                min={0}
                max={total}
                onChange={(e) =>
                  setDinheiroMisto(Math.min(total, Number(e.target.value) || 0))
                }
                className="h-12 text-lg tnum"
              />
              <div className="flex items-center justify-between rounded-[12px] bg-muted px-4 py-3">
                <span className="text-sm text-muted-foreground">Restante no débito</span>
                <span className="font-display text-xl text-foreground tnum">
                  {formatBRL(restanteMisto)}
                </span>
              </div>
            </div>
          )}
        </div>

        <Button
          size="lg"
          className="h-12 text-base"
          disabled={!podeConfirmar}
          onClick={confirmar}
        >
          {forma === "pix"
            ? "Confirmar recebimento"
            : forma === "dinheiro"
              ? "Confirmar e dar troco"
              : "Confirmar pagamento"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
