"use client";

import { useMemo, useState } from "react";
import { BarChart3, FileText, Layers, Wallet } from "lucide-react";
import { cn } from "cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DreWaterfall } from "./DreWaterfall";
import { FluxoView } from "./FluxoView";
import { ListaCaixas } from "./ListaCaixas";
import { ContasPagar } from "./ContasPagar";
import { useDadosStore, useSessaoStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import {
  dreDoPeriodo,
  fluxoDeCaixa,
  janelasDoPeriodo,
  type LojaFiltro,
  type Periodo,
} from "@/lib/domain";

type Aba = "dre" | "fluxo" | "caixas" | "contas";

const ABAS: { id: Aba; label: string; icone: typeof Layers }[] = [
  { id: "dre", label: "DRE", icone: Layers },
  { id: "fluxo", label: "Fluxo de caixa", icone: BarChart3 },
  { id: "caixas", label: "Caixas", icone: Wallet },
  { id: "contas", label: "Contas a pagar", icone: FileText },
];

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "7dias", label: "7 dias" },
  { id: "30dias", label: "30 dias" },
];

export function FinanceiroClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;
  const lojaAtiva = useSessaoStore((s) => s.lojaAtiva);
  const filtro: LojaFiltro = lojaAtiva;

  const [aba, setAba] = useState<Aba>("dre");
  const [periodo, setPeriodo] = useState<Periodo>("30dias");
  const [agora] = useState(() => new Date());

  const dre = useMemo(
    () => dreDoPeriodo(banco, filtro, periodo, agora),
    [banco, filtro, periodo, agora],
  );
  const janela = useMemo(() => janelasDoPeriodo(periodo, agora), [periodo, agora]);
  const fluxo = useMemo(
    () =>
      fluxoDeCaixa(
        banco,
        filtro,
        new Date(janela.atual.inicio),
        new Date(janela.atual.fim),
      ),
    [banco, filtro, janela],
  );

  if (!hidratado) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Fluxo de caixa, fechamentos, contas a pagar e o resultado do período.
          </p>
        </div>
        <Select
          value={periodo}
          onValueChange={(v) => setPeriodo((v as Periodo) ?? "30dias")}
          items={Object.fromEntries(PERIODOS.map((p) => [p.id, p.label]))}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODOS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {/* Abas */}
      <nav className="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 text-sm">
        {ABAS.map(({ id, label, icone: Icone }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors",
              aba === id
                ? "bg-cereja text-white"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icone className="size-4" />
            {label}
          </button>
        ))}
      </nav>

      {aba === "dre" && (
        <DreWaterfall dre={dre} banco={banco} filtro={filtro} periodo={periodo} agora={agora} />
      )}
      {aba === "fluxo" && <FluxoView fluxo={fluxo} />}
      {aba === "caixas" && (
        <ListaCaixas
          banco={banco}
          filtro={filtro}
          de={new Date(janela.atual.inicio)}
          ate={new Date(janela.atual.fim)}
        />
      )}
      {aba === "contas" && <ContasPagar filtro={filtro} agora={agora} />}
    </div>
  );
}
