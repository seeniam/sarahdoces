"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCheck, EyeOff, RotateCcw } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EstoqueNav } from "../EstoqueNav";
import { LojaSegmented } from "../LojaSegmented";
import { useDadosStore, useSessaoStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import { formatBRL, formatQuantidade } from "@/lib/format";
import type { CategoriaInsumo, ItemContagem, LojaId } from "@/types";

const CATEGORIA_LABEL: Record<CategoriaInsumo, string> = {
  proteina: "Proteínas",
  graos: "Grãos e mercearia",
  laticinios: "Laticínios",
  hortifruti: "Hortifruti",
  mercearia: "Mercearia",
  bebidas: "Bebidas",
  confeitaria: "Confeitaria",
  descartaveis: "Descartáveis",
};

// Itens contados na rotina da semana (os de maior valor / giro).
const INSUMOS_CONTAGEM = [
  "ins-carne", "ins-frango", "ins-linguica", "ins-bacon", "ins-ovo",
  "ins-arroz", "ins-feijao", "ins-flocao", "ins-queijo", "ins-cafe-po",
  "ins-leite", "ins-manteiga",
];

export function ContagemClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;
  const registrarContagem = useDadosStore((s) => s.registrarContagem);
  const usuarioId = useSessaoStore((s) => s.usuarioId);
  const lojaAtiva = useSessaoStore((s) => s.lojaAtiva);

  const [loja, setLoja] = useState<LojaId>(lojaAtiva === "todas" ? "loja-1" : lojaAtiva);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<{ itens: ItemContagem[]; totalReais: number } | null>(
    null,
  );

  const insumosContagem = useMemo(
    () =>
      INSUMOS_CONTAGEM.map((id) => banco.insumos.find((i) => i.id === id)).filter(
        (i): i is NonNullable<typeof i> => Boolean(i),
      ),
    [banco.insumos],
  );

  const porCategoria = useMemo(() => {
    const grupos = new Map<CategoriaInsumo, typeof insumosContagem>();
    for (const i of insumosContagem) {
      const g = grupos.get(i.categoria) ?? [];
      g.push(i);
      grupos.set(i.categoria, g);
    }
    return [...grupos.entries()];
  }, [insumosContagem]);

  const contados = insumosContagem.filter(
    (i) => valores[i.id] !== undefined && valores[i.id] !== "" && !Number.isNaN(Number(valores[i.id])),
  ).length;
  const total = insumosContagem.length;

  const insumoPorId = useMemo(() => new Map(banco.insumos.map((i) => [i.id, i])), [banco.insumos]);

  function concluir() {
    const entradas = insumosContagem
      .filter((i) => valores[i.id] !== undefined && valores[i.id] !== "")
      .map((i) => ({ insumoId: i.id, contado: Number(valores[i.id]) }))
      .filter((e) => !Number.isNaN(e.contado));
    if (entradas.length === 0) {
      toast.error("Conte ao menos um item antes de concluir.");
      return;
    }
    const r = registrarContagem({ lojaId: loja, usuarioId: usuarioId ?? "u-marta", contagens: entradas });
    setResultado({ itens: r.contagem.itens, totalReais: r.totalReais });
    if (r.relevantes.length > 0) {
      toast.warning(
        `Contagem concluída: ${r.relevantes.length} divergência(s) relevante(s) foram para a auditoria.`,
      );
    } else {
      toast.success("Contagem concluída — tudo dentro do esperado.");
    }
  }

  function reiniciar() {
    setValores({});
    setResultado(null);
  }

  if (!hidratado) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;
  }

  // ---- Fase 2: resultado (divergências reveladas) ----
  if (resultado) {
    const relevante = (it: ItemContagem) => {
      const insumo = insumoPorId.get(it.insumoId);
      const valor = Math.abs(it.diferenca) * (insumo?.custoMedio ?? 0);
      const pct = it.teorico > 0 ? Math.abs(it.diferenca) / it.teorico : 1;
      return (it.teorico > 0 && pct > 0.03 && Math.abs(it.diferenca) > 0.01) || valor > 20;
    };
    const ordenadas = [...resultado.itens].sort((a, b) => a.diferenca - b.diferenca);
    return (
      <div className="space-y-5">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-3xl leading-tight">Resultado da contagem</h1>
          <p className="text-sm text-muted-foreground">
            Agora sim: o teórico ao lado do que foi contado. A diferença em vermelho é o que falta.
          </p>
        </header>

        {/* Desktop: tabela */}
        <div className="hidden overflow-hidden rounded-[18px] border border-border md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Insumo</th>
                <th className="px-4 py-2.5 text-right font-medium">Teórico</th>
                <th className="px-4 py-2.5 text-right font-medium">Contado</th>
                <th className="px-4 py-2.5 text-right font-medium">Diferença</th>
                <th className="px-4 py-2.5 text-right font-medium">Em R$</th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((it) => {
                const insumo = insumoPorId.get(it.insumoId);
                const un = insumo?.unidade ?? "un";
                const reais = it.diferenca * (insumo?.custoMedio ?? 0);
                const falta = it.diferenca < -0.001;
                const rel = relevante(it);
                return (
                  <tr
                    key={it.insumoId}
                    className={cn("border-b border-border last:border-0", rel && falta && "bg-alerta/5")}
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {insumo?.nome}
                      {rel && falta && (
                        <span className="ml-2 whitespace-nowrap rounded-full bg-alerta/12 px-2 py-0.5 text-xs font-medium text-alerta">
                          sem explicação
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tnum text-muted-foreground">
                      {formatQuantidade(it.teorico, un)}
                    </td>
                    <td className="px-4 py-2.5 text-right tnum">{formatQuantidade(it.contado, un)}</td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right tnum font-semibold",
                        falta ? "text-alerta" : it.diferenca > 0.001 ? "text-pistache" : "text-muted-foreground",
                      )}
                    >
                      {it.diferenca >= 0 ? "+" : "−"}
                      {formatQuantidade(Math.abs(it.diferenca), un)}
                    </td>
                    <td className={cn("px-4 py-2.5 text-right tnum", falta && "text-alerta")}>
                      {formatBRL(reais)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile: lista de cartões */}
        <ul className="space-y-2 md:hidden">
          {ordenadas.map((it) => {
            const insumo = insumoPorId.get(it.insumoId);
            const un = insumo?.unidade ?? "un";
            const reais = it.diferenca * (insumo?.custoMedio ?? 0);
            const falta = it.diferenca < -0.001;
            const rel = relevante(it);
            return (
              <li
                key={it.insumoId}
                className={cn(
                  "rounded-[16px] border border-border bg-card p-3.5",
                  rel && falta && "border-alerta/30 bg-alerta/5",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{insumo?.nome}</p>
                  {rel && falta && (
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-alerta/12 px-2 py-0.5 text-xs font-medium text-alerta">
                      sem explicação
                    </span>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Teórico</p>
                    <p className="tnum">{formatQuantidade(it.teorico, un)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contado</p>
                    <p className="tnum">{formatQuantidade(it.contado, un)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Diferença</p>
                    <p
                      className={cn(
                        "tnum font-semibold",
                        falta ? "text-alerta" : it.diferenca > 0.001 ? "text-pistache" : "text-muted-foreground",
                      )}
                    >
                      {it.diferenca >= 0 ? "+" : "−"}
                      {formatQuantidade(Math.abs(it.diferenca), un)}
                    </p>
                    <p className={cn("text-xs tnum", falta ? "text-alerta" : "text-muted-foreground")}>
                      {formatBRL(reais)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between rounded-[16px] border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">Impacto total da divergência</span>
          <span
            className={cn(
              "tnum font-display text-xl",
              resultado.totalReais < 0 ? "text-alerta" : "text-foreground",
            )}
          >
            {formatBRL(resultado.totalReais)}
          </span>
        </div>

        <Button variant="outline" onClick={reiniciar}>
          <RotateCcw className="size-4" />
          Nova contagem
        </Button>
      </div>
    );
  }

  // ---- Fase 1: contagem cega ----
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-tight">Contagem cega</h1>
          <p className="text-sm text-muted-foreground">
            Conte o que está na prateleira. O sistema não mostra o esperado — a divergência aparece só no fim.
          </p>
        </div>
        <LojaSegmented
          lojas={banco.lojas}
          valor={loja}
          onChange={(id) => {
            // Trocar de loja zera a contagem em andamento (nunca misturar lojas).
            setLoja(id);
            setValores({});
            setResultado(null);
          }}
        />
      </header>

      <EstoqueNav />

      {/* Progresso */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-[16px] border border-border bg-card/95 px-4 py-3 backdrop-blur">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <EyeOff className="size-4" />
          Contagem às cegas
        </span>
        <span className="tnum text-sm font-medium">
          {contados} de {total} contados
        </span>
      </div>

      <div className="space-y-5">
        {porCategoria.map(([categoria, itens]) => (
          <section key={categoria} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {CATEGORIA_LABEL[categoria]}
            </h2>
            <ul className="space-y-2">
              {itens.map((insumo) => {
                const preenchido =
                  valores[insumo.id] !== undefined &&
                  valores[insumo.id] !== "" &&
                  !Number.isNaN(Number(valores[insumo.id]));
                return (
                  <li
                    key={insumo.id}
                    className={cn(
                      "flex items-center gap-3 rounded-[16px] border bg-card p-3 transition-colors",
                      preenchido ? "border-pistache/40" : "border-border",
                    )}
                  >
                    <span className="grid size-6 shrink-0 place-items-center">
                      {preenchido ? (
                        <CheckCircle2 className="size-5 text-pistache" />
                      ) : (
                        <span className="size-2 rounded-full bg-muted-foreground/40" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{insumo.nome}</p>
                      <p className="text-xs text-muted-foreground">em {insumo.unidade}</p>
                    </div>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={valores[insumo.id] ?? ""}
                      onChange={(e) =>
                        setValores((v) => ({ ...v, [insumo.id]: e.target.value }))
                      }
                      placeholder="0"
                      className="h-14 w-28 text-right text-lg font-semibold tnum"
                      aria-label={`Contagem de ${insumo.nome}`}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-[16px] sm:border">
        <Button
          onClick={concluir}
          className="h-14 w-full bg-cereja text-lg text-white hover:bg-cereja-calda"
        >
          <ClipboardCheck className="size-5" />
          Concluir e ver divergências
        </Button>
      </div>
    </div>
  );
}
