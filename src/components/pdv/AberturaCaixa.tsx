"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NumeroHeroi } from "@/components/shared/NumeroHeroi";
import { formatBRL } from "@/lib/format";
import { cn } from "cn";

const PRESETS = [50, 100, 150, 200];

/**
 * Abertura de caixa obrigatória: sem sessão aberta, não dá para vender.
 * Não é dispensável (o atendente precisa informar o troco inicial).
 */
export function AberturaCaixa({
  aberto,
  onAbrir,
}: {
  aberto: boolean;
  onAbrir: (valorInicial: number) => void;
}) {
  const [valor, setValor] = useState(100);

  return (
    <Dialog open={aberto} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Abrir o caixa</DialogTitle>
          <DialogDescription>
            Informe quanto tem de troco na gaveta para começar a vender.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <NumeroHeroi valor={valor} tamanho="grande" />
          <div className="flex flex-wrap justify-center gap-2">
            {PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValor(v)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  v === valor
                    ? "border-cereja bg-cereja text-white"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                {formatBRL(v)}
              </button>
            ))}
          </div>
        </div>

        <Button size="lg" className="h-12 text-base" onClick={() => onAbrir(valor)}>
          Abrir caixa
        </Button>
      </DialogContent>
    </Dialog>
  );
}
