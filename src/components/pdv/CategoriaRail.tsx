"use client";

import { LayoutGrid } from "lucide-react";
import { cn } from "cn";
import { ICONES_CATEGORIA } from "@/components/brand/icons";
import type { Categoria } from "@/types";

export function CategoriaRail({
  categorias,
  selecionada,
  onSelecionar,
}: {
  categorias: Categoria[];
  selecionada: string | null;
  onSelecionar: (id: string | null) => void;
}) {
  const itens = [
    { id: null as string | null, nome: "Todos", Icone: LayoutGrid },
    ...categorias.map((c) => ({
      id: c.id as string | null,
      nome: c.nome,
      Icone: ICONES_CATEGORIA[c.icone],
    })),
  ];

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {itens.map(({ id, nome, Icone }) => {
        const on = selecionada === id;
        return (
          <button
            key={id ?? "todos"}
            type="button"
            onClick={() => onSelecionar(id)}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1.5 rounded-[14px] border px-3 py-3 text-center text-[11px] font-medium leading-tight transition-colors lg:w-full",
              on
                ? "border-cereja bg-acucar/60 text-cereja"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            <Icone className="size-6" strokeWidth={1.5} />
            <span className="max-w-[72px] truncate lg:max-w-full">{nome}</span>
          </button>
        );
      })}
    </nav>
  );
}
