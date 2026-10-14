"use client";

import { useState } from "react";
import { Banknote, CheckCircle2, CreditCard, Landmark, Lock } from "lucide-react";
import { cn } from "cn";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FORMAS_CONTADAS, ROTULO_FORMA, type FechamentoPorForma } from "@/lib/domain";
import { formatBRL, formatBRLSinalado } from "@/lib/format";
import type { FormaContada, ValoresPorForma } from "@/types";

const ICONE: Record<FormaContada, typeof Banknote> = {
  dinheiro: Banknote,
  debito: CreditCard,
  credito: CreditCard,
};
const AJUDA: Record<FormaContada, string> = {
  dinheiro: "Conte tudo que está na gaveta",
  debito: "Total do relatório da maquininha",
  credito: "Total do relatório da maquininha",
};

export function FecharCaixaSheet({
  aberto,
  onOpenChange,
  lojaNome,
  onFechar,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  lojaNome: string;
  /** Deve chamar a store (fecharCaixa) e devolver o resultado por forma. */
  onFechar: (informado: ValoresPorForma) => FechamentoPorForma | null;
}) {
  const [valores, setValores] = useState<Record<FormaContada, string>>({
    dinheiro: "",
    debito: "",
    credito: "",
  });
  const [resultado, setResultado] = useState<FechamentoPorForma | null>(null);

  function confirmar() {
    const informado: ValoresPorForma = {
      dinheiro: Number(valores.dinheiro) || 0,
      debito: Number(valores.debito) || 0,
      credito: Number(valores.credito) || 0,
    };
    const r = onFechar(informado);
    if (r) setResultado(r);
  }

  function fechar() {
    onOpenChange(false);
    // Reseta depois de fechar (para a próxima abertura começar limpo).
    setTimeout(() => {
      setValores({ dinheiro: "", debito: "", credito: "" });
      setResultado(null);
    }, 250);
  }

  return (
    <Sheet open={aberto} onOpenChange={(v) => (v ? onOpenChange(v) : fechar())}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-xl">
            {resultado ? "Conferência do caixa" : "Fechar caixa"}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {resultado
              ? `${lojaNome} · esperado × informado`
              : "Informe os valores sem olhar o sistema."}
          </p>
        </SheetHeader>

        {!resultado ? (
          <>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <p className="flex items-center gap-2 rounded-[14px] border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                <Lock className="size-3.5 shrink-0" />
                Contagem às cegas: o esperado só aparece depois de confirmar.
              </p>

              {FORMAS_CONTADAS.map((forma) => {
                const Icone = ICONE[forma];
                return (
                  <div key={forma} className="rounded-[16px] border border-border p-4">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Icone className="size-4 text-muted-foreground" />
                      {ROTULO_FORMA[forma]}
                    </label>
                    <p className="mb-2 text-xs text-muted-foreground">{AJUDA[forma]}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={valores[forma]}
                        onChange={(e) =>
                          setValores((v) => ({ ...v, [forma]: e.target.value }))
                        }
                        placeholder="0,00"
                        className="h-14 text-right text-2xl font-semibold tnum"
                        aria-label={`Valor contado em ${ROTULO_FORMA[forma]}`}
                      />
                    </div>
                  </div>
                );
              })}

              <p className="flex items-center gap-2 rounded-[14px] border border-azulejo/25 bg-azulejo/8 px-3 py-2.5 text-sm text-foreground">
                <Landmark className="size-4 shrink-0 text-azulejo" />
                Pix confere direto pelo banco — não entra na contagem da gaveta.
              </p>
            </div>

            <div className="border-t border-border px-5 py-4">
              <Button
                onClick={confirmar}
                className="h-14 w-full bg-cereja text-lg text-white hover:bg-cereja-calda"
              >
                Confirmar fechamento
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {FORMAS_CONTADAS.map((forma) => {
                const dif = resultado.diferenca[forma];
                const zerado = Math.abs(dif) < 0.005;
                return (
                  <div key={forma} className="rounded-[16px] border border-border p-4">
                    <p className="mb-2 text-sm font-medium">{ROTULO_FORMA[forma]}</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <Campo rotulo="Esperado" valor={formatBRL(resultado.esperado[forma])} />
                      <Campo rotulo="Informado" valor={formatBRL(resultado.informado[forma])} />
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Diferença</p>
                        <p
                          className={cn(
                            "tnum font-semibold",
                            zerado ? "text-pistache" : "text-alerta",
                          )}
                        >
                          {zerado ? formatBRL(0) : formatBRLSinalado(dif)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 border-t border-border px-5 py-4">
              <div
                className={cn(
                  "flex items-center justify-between rounded-[16px] px-4 py-3",
                  Math.abs(resultado.diferencaTotal) < 0.005
                    ? "border border-pistache/30 bg-pistache/8"
                    : "border border-alerta/30 bg-alerta/8",
                )}
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  {Math.abs(resultado.diferencaTotal) < 0.005 ? (
                    <>
                      <CheckCircle2 className="size-4 text-pistache" />
                      Caixa certo
                    </>
                  ) : (
                    "Diferença total"
                  )}
                </span>
                <span
                  className={cn(
                    "tnum font-display text-xl",
                    Math.abs(resultado.diferencaTotal) < 0.005 ? "text-pistache" : "text-alerta",
                  )}
                >
                  {Math.abs(resultado.diferencaTotal) < 0.005
                    ? formatBRL(0)
                    : formatBRLSinalado(resultado.diferencaTotal)}
                </span>
              </div>
              {Math.abs(resultado.diferencaTotal) >= 0.005 && (
                <p className="text-center text-xs text-muted-foreground">
                  A diferença foi registrada na auditoria.
                </p>
              )}
              <Button onClick={fechar} variant="outline" className="h-12 w-full">
                Concluir
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="tnum">{valor}</p>
    </div>
  );
}
