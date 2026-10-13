"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { cn } from "cn";
import { FotoProduto } from "@/components/shared/FotoProduto";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/format";
import type { CategoriaIcone } from "@/components/brand/icons";
import type { Produto } from "@/types";

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function GradeProdutos({
  produtos,
  iconePorCategoria,
  onAdd,
}: {
  produtos: Produto[];
  iconePorCategoria: Record<string, CategoriaIcone>;
  onAdd: (produto: Produto) => void;
}) {
  const [busca, setBusca] = useState("");
  const q = normalizar(busca.trim());
  const lista = q
    ? produtos.filter((p) => normalizar(p.nome).includes(q))
    : produtos;

  return (
    <div className="flex h-full flex-col">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto…"
          className="h-11 pl-9"
        />
      </div>

      <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pb-24 sm:grid-cols-3 2xl:grid-cols-4 lg:pb-0">
        {lista.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onAdd(p)}
            className={cn(
              "group/card flex flex-col overflow-hidden rounded-[14px] border border-border bg-card text-left shadow-soft transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            )}
          >
            <FotoProduto
              src={p.foto}
              alt={p.nome}
              categoria={iconePorCategoria[p.categoriaId]}
              className="rounded-none"
              sizes="(max-width: 640px) 45vw, 200px"
            />
            <div className="flex items-start justify-between gap-1.5 p-2.5">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                  {p.nome}
                </p>
                <p className="text-sm text-muted-foreground tnum">
                  {formatBRL(p.preco)}
                </p>
              </div>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cereja text-white transition-transform group-active/card:scale-90">
                <Plus className="size-4" />
              </span>
            </div>
          </button>
        ))}

        {lista.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            Nenhum produto encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
