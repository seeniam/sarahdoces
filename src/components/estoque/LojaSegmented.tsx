"use client";

import { cn } from "cn";
import type { Loja, LojaId } from "@/types";

/** Alternador de loja (segmentado) com as cores da loja. Estoque é por loja. */
export function LojaSegmented({
  lojas,
  valor,
  onChange,
  className,
}: {
  lojas: Loja[];
  valor: LojaId;
  onChange: (id: LojaId) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex gap-1 rounded-full border border-border bg-card p-1",
        className,
      )}
      role="group"
      aria-label="Selecionar loja"
    >
      {lojas.map((loja) => {
        const ativo = loja.id === valor;
        const curto = loja.nome.replace(/^Loja \d+\s*[—-]\s*/, "");
        return (
          <button
            key={loja.id}
            type="button"
            onClick={() => onChange(loja.id)}
            aria-pressed={ativo}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              ativo
                ? loja.cor === "loja-1"
                  ? "bg-cereja text-white"
                  : "bg-azulejo text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                ativo ? "bg-white/80" : loja.cor === "loja-1" ? "bg-cereja" : "bg-azulejo",
              )}
            />
            {curto}
          </button>
        );
      })}
    </div>
  );
}
