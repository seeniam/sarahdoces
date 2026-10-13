"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import { formatBRL } from "@/lib/format";
import type { Adicional, ItemComanda, Produto } from "@/types";

export function ItemSheet({
  aberto,
  onOpenChange,
  produto,
  item,
  onSalvar,
}: {
  aberto: boolean;
  onOpenChange: (o: boolean) => void;
  produto: Produto;
  item: ItemComanda;
  onSalvar: (adicionais: Adicional[], obs: string | undefined) => void;
}) {
  const [adicionais, setAdicionais] = useState<Adicional[]>(item.adicionais);
  const [obs, setObs] = useState(item.obs ?? "");

  const temAdicional = (id: string) => adicionais.some((a) => a.id === id);
  const alternar = (a: Adicional) =>
    setAdicionais((atual) =>
      atual.some((x) => x.id === a.id)
        ? atual.filter((x) => x.id !== a.id)
        : [...atual, a],
    );

  function salvar() {
    onSalvar(adicionais, obs.trim() || undefined);
    onOpenChange(false);
  }

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[20px]">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">{produto.nome}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-8">
          {produto.adicionais.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Adicionais</p>
              <div className="flex flex-wrap gap-2">
                {produto.adicionais.map((a) => {
                  const on = temAdicional(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => alternar(a)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                        on
                          ? "border-cereja bg-acucar/60 text-cereja"
                          : "border-border bg-card text-foreground hover:bg-muted",
                      )}
                    >
                      {on && <Check className="size-4" />}
                      {a.nome}
                      <span className="text-xs text-muted-foreground tnum">
                        +{formatBRL(a.preco)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Observação
            </label>
            <Textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="ovo mole, sem cebola…"
              className="min-h-16"
            />
          </div>

          <Button size="lg" className="h-12 w-full text-base" onClick={salvar}>
            Salvar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
