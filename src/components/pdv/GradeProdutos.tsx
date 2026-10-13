"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
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
  quantidades,
  onAdd,
}: {
  produtos: Produto[];
  iconePorCategoria: Record<string, CategoriaIcone>;
  quantidades: Record<string, number>;
  onAdd: (produto: Produto) => void;
}) {
  const [busca, setBusca] = useState("");
  const semMovimento = useReducedMotion();
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

      {/* O scroll fica no wrapper, não na própria grade: grid com altura
          definida encolhe as linhas (itens com aspect-ratio colapsam) e corta o
          nome/preço. Com o wrapper rolando, as linhas mantêm o tamanho natural. */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-24 lg:pb-0">
        <div className="grid grid-cols-2 content-start gap-3 sm:grid-cols-3 2xl:grid-cols-4">
          {lista.map((p) => {
          const qtd = quantidades[p.id] ?? 0;
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => onAdd(p)}
              whileTap={semMovimento ? undefined : { scale: 0.96 }}
              className="flex flex-col overflow-hidden rounded-[14px] border border-border bg-card text-left shadow-soft focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[tem=1]:ring-2 data-[tem=1]:ring-cereja/50"
              data-tem={qtd > 0 ? 1 : 0}
            >
              <div className="relative">
                <FotoProduto
                  src={p.foto}
                  alt={p.nome}
                  categoria={iconePorCategoria[p.categoriaId]}
                  className="rounded-none"
                  sizes="(max-width: 640px) 45vw, 200px"
                />
                {qtd > 0 && (
                  <motion.span
                    key={qtd}
                    initial={semMovimento ? false : { scale: 1.35 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-cereja font-display text-sm text-white shadow-soft tnum"
                  >
                    {qtd}
                  </motion.span>
                )}
              </div>
              <div className="p-2.5">
                <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-foreground">
                  {p.nome}
                </p>
                <p className="text-sm text-muted-foreground tnum">
                  {formatBRL(p.preco)}
                </p>
              </div>
            </motion.button>
          );
        })}

          {lista.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
