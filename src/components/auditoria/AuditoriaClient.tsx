"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { cn } from "cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { EventoLinha } from "./EventoLinha";
import { EventoDetalhe } from "./EventoDetalhe";
import { PontosAtencao } from "./PontosAtencao";
import { ROTULO_TIPO_EVENTO, ROTULO_SEVERIDADE } from "./rotulos";
import { useDadosStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import type { EventoAuditoria, LojaId, Severidade, TipoEvento } from "@/types";

type Aba = "timeline" | "atencao";
type PeriodoAud = "7" | "30" | "tudo";

const PERIODOS: Record<PeriodoAud, string> = {
  "7": "7 dias",
  "30": "30 dias",
  tudo: "Tudo",
};

export function AuditoriaClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;
  const params = useSearchParams();

  const [aba, setAba] = useState<Aba>(params.get("aba") === "atencao" ? "atencao" : "timeline");
  const [periodo, setPeriodo] = useState<PeriodoAud>("30");
  // Valida o parâmetro de tipo da URL (deep-link) contra os tipos conhecidos.
  const tipoParam = params.get("tipo");
  const [fTipo, setFTipo] = useState<TipoEvento | "todos">(
    tipoParam && Object.hasOwn(ROTULO_TIPO_EVENTO, tipoParam)
      ? (tipoParam as TipoEvento)
      : "todos",
  );
  const [fLoja, setFLoja] = useState<LojaId | "todas">("todas");
  const [fPessoa, setFPessoa] = useState<string>("todas");
  const [fSeveridade, setFSeveridade] = useState<Severidade | "todas">("todas");
  const [pessoaSel, setPessoaSel] = useState<string | null>(params.get("pessoa"));
  const [eventoAberto, setEventoAberto] = useState<EventoAuditoria | null>(null);

  const [agora] = useState(() => new Date());
  const { de, ate } = useMemo(() => {
    const ate = agora;
    if (periodo === "tudo") return { de: new Date(0), ate };
    const dias = periodo === "7" ? 7 : 30;
    return { de: new Date(ate.getTime() - dias * 86400000), ate };
  }, [periodo, agora]);

  const pessoasComEvento = useMemo(() => {
    const ids = new Set(banco.eventos.map((e) => e.usuarioId));
    return banco.usuarios.filter((u) => ids.has(u.id));
  }, [banco.eventos, banco.usuarios]);

  const tiposPresentes = useMemo(
    () => [...new Set(banco.eventos.map((e) => e.tipo))],
    [banco.eventos],
  );

  const eventos = useMemo(() => {
    const deMs = de.getTime();
    const ateMs = ate.getTime();
    return banco.eventos
      .filter((e) => {
        const t = new Date(e.data).getTime();
        if (t < deMs || t > ateMs) return false;
        if (fTipo !== "todos" && e.tipo !== fTipo) return false;
        if (fLoja !== "todas" && e.lojaId !== fLoja) return false;
        if (fPessoa !== "todas" && e.usuarioId !== fPessoa) return false;
        if (fSeveridade !== "todas" && e.severidade !== fSeveridade) return false;
        return true;
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [banco.eventos, de, ate, fTipo, fLoja, fPessoa, fSeveridade]);

  if (!hidratado) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-tight">Auditoria</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5" />
            Registros de auditoria não podem ser alterados.
          </p>
        </div>
        <Select
          value={periodo}
          onValueChange={(v) => setPeriodo((v as PeriodoAud) ?? "30")}
          items={PERIODOS}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIODOS) as PeriodoAud[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PERIODOS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {/* Abas */}
      <nav className="flex gap-1 rounded-full border border-border bg-card p-1 text-sm">
        {([["timeline", "Linha do tempo"], ["atencao", "Pontos de atenção"]] as const).map(
          ([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setAba(id);
                setPessoaSel(null);
              }}
              className={cn(
                "flex-1 rounded-full px-4 py-2 font-medium transition-colors",
                aba === id
                  ? "bg-cereja text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {label}
            </button>
          ),
        )}
      </nav>

      {aba === "timeline" ? (
        <>
          {/* Filtros */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Select
              value={fTipo}
              onValueChange={(v) => setFTipo((v as TipoEvento) ?? "todos")}
              items={{ todos: "Todos os tipos", ...Object.fromEntries(tiposPresentes.map((t) => [t, ROTULO_TIPO_EVENTO[t]])) }}
            >
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {tiposPresentes.map((t) => (
                  <SelectItem key={t} value={t}>{ROTULO_TIPO_EVENTO[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={fLoja}
              onValueChange={(v) => setFLoja((v as LojaId) ?? "todas")}
              items={{ todas: "Todas as lojas", ...Object.fromEntries(banco.lojas.map((l) => [l.id, l.nome])) }}
            >
              <SelectTrigger><SelectValue placeholder="Loja" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as lojas</SelectItem>
                {banco.lojas.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={fPessoa}
              onValueChange={(v) => setFPessoa(v ?? "todas")}
              items={{ todas: "Todas as pessoas", ...Object.fromEntries(pessoasComEvento.map((u) => [u.id, u.nome])) }}
            >
              <SelectTrigger><SelectValue placeholder="Pessoa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as pessoas</SelectItem>
                {pessoasComEvento.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={fSeveridade}
              onValueChange={(v) => setFSeveridade((v as Severidade) ?? "todas")}
              items={{ todas: "Todas", info: ROTULO_SEVERIDADE.info, atencao: ROTULO_SEVERIDADE.atencao, critico: ROTULO_SEVERIDADE.critico }}
            >
              <SelectTrigger><SelectValue placeholder="Severidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="critico">{ROTULO_SEVERIDADE.critico}</SelectItem>
                <SelectItem value="atencao">{ROTULO_SEVERIDADE.atencao}</SelectItem>
                <SelectItem value="info">{ROTULO_SEVERIDADE.info}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {eventos.length === 0 ? (
            <EstadoVazio
              titulo="Nenhum evento"
              descricao="Ajuste os filtros ou o período para ver os registros de auditoria."
            />
          ) : (
            <ul className="space-y-2">
              {eventos.map((e) => (
                <EventoLinha key={e.id} evento={e} banco={banco} onClick={() => setEventoAberto(e)} />
              ))}
            </ul>
          )}
        </>
      ) : (
        <PontosAtencao
          banco={banco}
          de={de}
          ate={ate}
          pessoaSel={pessoaSel}
          onSelecionar={setPessoaSel}
          onVoltar={() => setPessoaSel(null)}
          onAbrirEvento={setEventoAberto}
        />
      )}

      <EventoDetalhe evento={eventoAberto} banco={banco} onClose={() => setEventoAberto(null)} />
    </div>
  );
}
