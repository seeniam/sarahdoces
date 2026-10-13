"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDadosStore, useSessaoStore, type LojaAtiva } from "@/lib/store";
import type { Perfil } from "@/types";

const COR_LOJA: Record<string, string> = {
  "loja-1": "var(--cereja)",
  "loja-2": "var(--azulejo)",
  todas: "var(--muted-foreground)",
};

export function StoreSwitcher({ perfil }: { perfil: Perfil }) {
  const lojas = useDadosStore((s) => s.lojas);
  const lojaAtiva = useSessaoStore((s) => s.lojaAtiva);
  const setLoja = useSessaoStore((s) => s.setLoja);

  const podeTodas = perfil === "dona" || perfil === "gerente";

  const opcoes: { id: LojaAtiva; nome: string }[] = [
    ...(podeTodas ? [{ id: "todas" as const, nome: "Todas as lojas" }] : []),
    ...lojas.map((l) => ({ id: l.id as LojaAtiva, nome: l.nome })),
  ];

  const atual = opcoes.find((o) => o.id === lojaAtiva) ?? opcoes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: COR_LOJA[atual.id] }}
        />
        <span className="max-w-[9rem] truncate">{atual.nome}</span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {opcoes.map((o) => (
          <DropdownMenuItem
            key={o.id}
            onClick={() => setLoja(o.id)}
            className="gap-2"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COR_LOJA[o.id] }}
            />
            <span className="flex-1 truncate">{o.nome}</span>
            {o.id === lojaAtiva && <Check className="size-4 text-cereja" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
