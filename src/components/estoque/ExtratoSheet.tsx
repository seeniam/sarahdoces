"use client";

import {
  ArrowDownRight,
  ArrowLeftRight,
  ClipboardCheck,
  PackagePlus,
  ShoppingCart,
  TriangleAlert,
  Utensils,
} from "lucide-react";
import { cn } from "cn";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatBRL, formatData, formatQuantidade } from "@/lib/format";
import type { BalancoInsumo } from "@/lib/domain";
import type { Insumo, Movimentacao, TipoMovimentacao } from "@/types";

const ICONE: Record<TipoMovimentacao, typeof ShoppingCart> = {
  saldo_inicial: PackagePlus,
  compra: ShoppingCart,
  consumo: Utensils,
  estorno: ArrowDownRight,
  perda: TriangleAlert,
  transferencia_entrada: ArrowLeftRight,
  transferencia_saida: ArrowLeftRight,
  ajuste_contagem: ClipboardCheck,
};

function sinalClasse(qtd: number, tipo: TipoMovimentacao) {
  if (tipo === "ajuste_contagem") return qtd < 0 ? "text-alerta" : "text-pistache";
  return qtd >= 0 ? "text-pistache" : "text-foreground";
}

export function ExtratoSheet({
  aberto,
  onOpenChange,
  insumo,
  nomeLoja,
  movimentacoes,
  balanco,
  teoricoAgora,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  insumo: Insumo | null;
  nomeLoja: string;
  movimentacoes: Movimentacao[];
  balanco: BalancoInsumo | null;
  teoricoAgora: number;
}) {
  if (!insumo || !balanco) {
    return (
      <Sheet open={aberto} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md" />
      </Sheet>
    );
  }

  // Linhas em ordem cronológica inversa (mais recente primeiro) para leitura.
  const linhas = [...movimentacoes].reverse();
  const un = insumo.unidade;

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-xl">{insumo.nome}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Extrato de movimentações · {nomeLoja}
          </p>
        </SheetHeader>

        {/* Resumo do período no topo (onde a Dona vê a carne). */}
        <div className="border-b border-border bg-secondary/40 px-5 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Resumo rotulo="Comprado" valor={formatQuantidade(balanco.comprado, un)} />
            <Resumo rotulo="Vendido" valor={formatQuantidade(balanco.vendido, un)} />
            <Resumo rotulo="Perdido" valor={formatQuantidade(balanco.perdido, un)} />
            <Resumo
              rotulo={balanco.temContagem ? "Em estoque (contado)" : "Em estoque (teórico)"}
              valor={formatQuantidade(balanco.emEstoque, un)}
            />
          </div>
          {balanco.semExplicacao > 0.01 && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-alerta/30 bg-alerta/8 px-3 py-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-alerta">
                <TriangleAlert className="size-4" />
                Sem explicação
              </span>
              <span className="tnum text-sm font-semibold text-alerta">
                {formatQuantidade(balanco.semExplicacao, un)} ·{" "}
                {formatBRL(balanco.semExplicacao * balanco.custoMedio)}
              </span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <ol className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
          {linhas.map((m) => {
            const Icone = ICONE[m.tipo];
            const ajuste = m.tipo === "ajuste_contagem";
            return (
              <li
                key={m.id}
                className={cn("flex items-start gap-3 px-5 py-3", ajuste && "bg-alerta/5")}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border",
                    ajuste ? "border-alerta/30 text-alerta" : "border-border text-muted-foreground",
                  )}
                >
                  <Icone className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{m.descricao}</p>
                  <p className="text-xs text-muted-foreground">{formatData(m.data)}</p>
                </div>
                <span className={cn("tnum shrink-0 text-sm font-semibold", sinalClasse(m.qtd, m.tipo))}>
                  {m.qtd >= 0 ? "+" : "−"}
                  {formatQuantidade(Math.abs(m.qtd), un)}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-sm text-muted-foreground">Estoque teórico agora</span>
          <StatusBadge variante="info">
            {formatQuantidade(teoricoAgora, un)}
          </StatusBadge>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="tnum text-sm font-semibold text-foreground">{valor}</p>
    </div>
  );
}
