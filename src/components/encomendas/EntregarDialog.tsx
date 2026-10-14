"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDadosStore } from "@/lib/store";
import { formatBRL } from "@/lib/format";
import { saldoEncomenda } from "./util";
import type { Encomenda, FormaPagamento } from "@/types";

const FORMAS: { id: FormaPagamento; label: string }[] = [
  { id: "pix", label: "Pix" },
  { id: "dinheiro", label: "Dinheiro" },
  { id: "debito", label: "Débito" },
  { id: "credito", label: "Crédito" },
];

export function EntregarDialog({
  encomenda,
  onClose,
}: {
  encomenda: Encomenda | null;
  onClose: () => void;
}) {
  const entregarEncomenda = useDadosStore((s) => s.entregarEncomenda);
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const saldo = encomenda ? saldoEncomenda(encomenda) : 0;

  function confirmar() {
    if (!encomenda) return;
    entregarEncomenda({ id: encomenda.id, forma });
    onClose();
    toast.success(`Encomenda de ${encomenda.cliente} entregue`, {
      description: saldo > 0 ? `Saldo ${formatBRL(saldo)} recebido em ${FORMAS.find((f) => f.id === forma)?.label}` : undefined,
    });
  }

  return (
    <Dialog open={encomenda !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Entregar encomenda</DialogTitle>
        </DialogHeader>
        {encomenda && (
          <div className="space-y-4">
            <div className="rounded-[14px] border border-border bg-secondary/40 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">{encomenda.cliente}</p>
              <p className="text-muted-foreground">
                {saldo > 0 ? (
                  <>Saldo a receber: <span className="tnum font-medium text-foreground">{formatBRL(saldo)}</span></>
                ) : (
                  "Sem saldo pendente (já quitado)."
                )}
              </p>
            </div>

            {saldo > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Forma de pagamento do saldo</p>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setForma(f.id)}
                      className={cn(
                        "rounded-[12px] border px-3 py-2.5 text-sm font-medium transition-colors",
                        forma === f.id
                          ? "border-cereja bg-cereja text-white"
                          : "border-border bg-card hover:bg-muted",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={confirmar} className="h-12 w-full bg-cereja text-white hover:bg-cereja-calda">
              Confirmar entrega
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
