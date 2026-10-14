"use client";

import { useMemo, useState } from "react";
import { CalendarDays, LayoutGrid, Plus } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { EncomendaCard } from "./EncomendaCard";
import { EncomendaForm } from "./EncomendaForm";
import { EntregarDialog } from "./EntregarDialog";
import {
  COR_STATUS_ENCOMENDA,
  ROTULO_STATUS_ENCOMENDA,
  STATUS_ENCOMENDA,
} from "./rotulos";
import { useDadosStore, useSessaoStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import { formatData } from "@/lib/format";
import type { Encomenda } from "@/types";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const TZ = "America/Fortaleza";

export function EncomendasClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;
  const avancarStatusEncomenda = useDadosStore((s) => s.avancarStatusEncomenda);
  const lojaAtiva = useSessaoStore((s) => s.lojaAtiva);

  const [vista, setVista] = useState<"kanban" | "calendario">("kanban");
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Encomenda | null>(null);
  const [entregando, setEntregando] = useState<Encomenda | null>(null);
  const [agora] = useState(() => new Date());

  const encomendas = useMemo(
    () =>
      banco.encomendas
        .filter((e) => lojaAtiva === "todas" || e.lojaId === lojaAtiva)
        .sort((a, b) => new Date(a.dataEntrega).getTime() - new Date(b.dataEntrega).getTime()),
    [banco.encomendas, lojaAtiva],
  );

  function abrirNova() {
    setEditando(null);
    setFormAberto(true);
  }
  function abrirEdicao(e: Encomenda) {
    setEditando(e);
    setFormAberto(true);
  }

  const propsCard = {
    banco,
    agora,
    onAvancar: (e: Encomenda) => avancarStatusEncomenda(e.id),
    onEntregar: (e: Encomenda) => setEntregando(e),
    onEditar: abrirEdicao,
  };

  if (!hidratado) return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-tight">Encomendas</h1>
          <p className="text-sm text-muted-foreground">
            A agenda da confeitaria — do orçamento à entrega.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setVista("kanban")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                vista === "kanban" ? "bg-cereja text-white" : "text-muted-foreground",
              )}
            >
              <LayoutGrid className="size-4" />
              Quadro
            </button>
            <button
              type="button"
              onClick={() => setVista("calendario")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                vista === "calendario" ? "bg-cereja text-white" : "text-muted-foreground",
              )}
            >
              <CalendarDays className="size-4" />
              Semana
            </button>
          </div>
          <Button onClick={abrirNova} className="bg-cereja text-white hover:bg-cereja-calda">
            <Plus className="size-4" />
            Nova
          </Button>
        </div>
      </header>

      {encomendas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma encomenda"
          descricao="Crie a primeira encomenda da confeitaria."
          tom="cereja"
          acao={
            <Button onClick={abrirNova} className="bg-cereja text-white hover:bg-cereja-calda">
              <Plus className="size-4" />
              Nova encomenda
            </Button>
          }
        />
      ) : vista === "kanban" ? (
        <Kanban encomendas={encomendas} propsCard={propsCard} />
      ) : (
        <Calendario encomendas={encomendas} agora={agora} propsCard={propsCard} />
      )}

      <EncomendaForm
        aberto={formAberto}
        onOpenChange={setFormAberto}
        banco={banco}
        encomenda={editando}
      />
      <EntregarDialog encomenda={entregando} onClose={() => setEntregando(null)} />
    </div>
  );
}

type PropsCard = {
  banco: DadosState;
  agora: Date;
  onAvancar: (e: Encomenda) => void;
  onEntregar: (e: Encomenda) => void;
  onEditar: (e: Encomenda) => void;
};

function Kanban({ encomendas, propsCard }: { encomendas: Encomenda[]; propsCard: PropsCard }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-3">
        {STATUS_ENCOMENDA.map((st) => {
          const lista = encomendas.filter((e) => e.status === st);
          return (
            <section key={st} className="flex w-72 shrink-0 flex-col">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className={cn("size-2.5 rounded-full", COR_STATUS_ENCOMENDA[st])} />
                  {ROTULO_STATUS_ENCOMENDA[st]}
                </span>
                <span className="tnum text-xs text-muted-foreground">{lista.length}</span>
              </div>
              <div className="flex-1 space-y-2 rounded-[16px] bg-secondary/40 p-2">
                {lista.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">Vazio</p>
                ) : (
                  lista.map((e) => <EncomendaCard key={e.id} encomenda={e} {...propsCard} />)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Calendario({
  encomendas,
  agora,
  propsCard,
}: {
  encomendas: Encomenda[];
  agora: Date;
  propsCard: PropsCard;
}) {
  // Semana atual (domingo a sábado), no fuso de São Luís.
  const dias = useMemo(() => {
    const hojeKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(agora);
    const base = new Date(`${hojeKey}T12:00:00-03:00`);
    const dow = base.getUTCDay(); // 0 = domingo
    const inicio = new Date(base);
    inicio.setUTCDate(inicio.getUTCDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio);
      d.setUTCDate(d.getUTCDate() + i);
      const key = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
      return { key, iso: d.toISOString(), label: DIAS_SEMANA[i] };
    });
  }, [agora]);

  const hojeKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(agora);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-max grid-cols-7 gap-2 lg:min-w-0">
        {dias.map((dia) => {
          const lista = encomendas.filter(
            (e) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(e.dataEntrega)) === dia.key,
          );
          const ehHoje = dia.key === hojeKey;
          return (
            <div key={dia.key} className="w-56 lg:w-auto">
              <div
                className={cn(
                  "mb-2 rounded-[12px] px-2 py-1.5 text-center",
                  ehHoje ? "bg-cereja text-white" : "bg-secondary/50 text-foreground",
                )}
              >
                <p className="text-xs font-medium">{dia.label}</p>
                <p className="text-sm font-semibold">{formatData(dia.iso).slice(0, 5)}</p>
              </div>
              <div className="space-y-2">
                {lista.map((e) => (
                  <EncomendaCard key={e.id} encomenda={e} compacto {...propsCard} />
                ))}
                {lista.length === 0 && (
                  <p className="py-4 text-center text-[11px] text-muted-foreground">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
