"use client";

import { FotoProduto } from "@/components/shared/FotoProduto";
import { formatBRL } from "@/lib/format";
import type { CategoriaIcone } from "@/components/brand/icons";
import type { TopProduto } from "@/lib/domain";

export function TopProdutosChart({
  dados,
  iconePorCategoria,
}: {
  dados: TopProduto[];
  iconePorCategoria: Record<string, CategoriaIcone>;
}) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  if (dados.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sem vendas no período.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {dados.map((d) => (
        <li key={d.produto.id} className="flex items-center gap-3">
          <div className="size-9 shrink-0">
            <FotoProduto
              src={d.produto.foto}
              alt={d.produto.nome}
              aspecto="1:1"
              categoria={iconePorCategoria[d.produto.categoriaId]}
              sizes="36px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {d.produto.nome}
              </span>
              <span className="shrink-0 text-sm font-semibold text-foreground tnum">
                {formatBRL(d.valor)}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-cereja"
                style={{ width: `${(d.valor / max) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
