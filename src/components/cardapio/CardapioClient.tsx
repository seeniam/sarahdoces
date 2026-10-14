"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Tag } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FotoProduto } from "@/components/shared/FotoProduto";
import { AlterarPrecoDialog } from "./AlterarPrecoDialog";
import { ProdutoForm } from "./ProdutoForm";
import { useDadosStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import { margem } from "@/lib/domain";
import { formatBRL, formatPorcentagem } from "@/lib/format";
import type { CategoriaIcone } from "@/components/brand/icons";
import type { Produto } from "@/types";

function corMargem(m: number): { cls: string; dot: string } {
  if (m >= 0.6) return { cls: "text-pistache", dot: "bg-pistache" };
  if (m >= 0.4) return { cls: "text-doce-de-leite", dot: "bg-doce-de-leite" };
  return { cls: "text-alerta", dot: "bg-alerta" };
}

export function CardapioClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;
  const alternarProdutoAtivo = useDadosStore((s) => s.alternarProdutoAtivo);

  const [precoDe, setPrecoDe] = useState<Produto | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);

  const iconePorCategoria = useMemo(
    () => Object.fromEntries(banco.categorias.map((c) => [c.id, c.icone])) as Record<string, CategoriaIcone>,
    [banco.categorias],
  );

  const porCategoria = useMemo(() => {
    const cats = [...banco.categorias].sort((a, b) => a.ordem - b.ordem);
    return cats
      .map((c) => ({
        categoria: c,
        produtos: banco.produtos.filter((p) => p.categoriaId === c.id),
      }))
      .filter((g) => g.produtos.length > 0);
  }, [banco.categorias, banco.produtos]);

  function abrirNovo() {
    setEditando(null);
    setFormAberto(true);
  }

  if (!hidratado) return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-tight">Cardápio</h1>
          <p className="text-sm text-muted-foreground">
            Produtos, preço e margem. Alterar preço fica registrado.
          </p>
        </div>
        <Button onClick={abrirNovo} className="bg-cereja text-white hover:bg-cereja-calda">
          <Plus className="size-4" />
          Novo produto
        </Button>
      </header>

      {porCategoria.map(({ categoria, produtos }) => (
        <section key={categoria.id} className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">{categoria.nome}</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {produtos.map((p) => {
              const m = margem(p.preco, p.custo);
              const cor = corMargem(m);
              return (
                <li
                  key={p.id}
                  className={cn(
                    "flex gap-3 rounded-[16px] border border-border bg-card p-3",
                    !p.ativo && "opacity-60",
                  )}
                >
                  <FotoProduto
                    src={p.foto}
                    alt={p.nome}
                    aspecto="1:1"
                    categoria={iconePorCategoria[p.categoriaId]}
                    className="w-16 shrink-0"
                    sizes="64px"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium text-foreground">{p.nome}</p>
                      <Switch
                        checked={p.ativo}
                        onCheckedChange={() => alternarProdutoAtivo(p.id)}
                        aria-label={`${p.ativo ? "Desativar" : "Ativar"} ${p.nome}`}
                      />
                    </div>
                    <p className="text-sm">
                      <span className="font-semibold text-foreground">{formatBRL(p.preco)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">CMV {formatBRL(p.custo)}</span>
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-1.5">
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", cor.cls)}>
                        <span className={cn("size-1.5 rounded-full", cor.dot)} />
                        margem {formatPorcentagem(m, 0)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Editar ${p.nome}`}
                          onClick={() => {
                            setEditando(p);
                            setFormAberto(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7" onClick={() => setPrecoDe(p)}>
                          <Tag className="size-3.5" />
                          Preço
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <AlterarPrecoDialog produto={precoDe} onClose={() => setPrecoDe(null)} />
      <ProdutoForm aberto={formAberto} onOpenChange={setFormAberto} banco={banco} produto={editando} />
    </div>
  );
}
