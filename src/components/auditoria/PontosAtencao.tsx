"use client";

import { useMemo } from "react";
import { ArrowLeft, ChevronRight, Info } from "lucide-react";
import { cn } from "cn";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { EventoLinha } from "./EventoLinha";
import { pontosDeAtencao, type PontoAtencao } from "@/lib/domain";
import { formatBRL } from "@/lib/format";
import type { BancoMock, EventoAuditoria } from "@/types";

const OBSERVACAO_FIXA =
  "Padrões fora da média indicam onde conversar e acompanhar, não comprovam irregularidade.";

export function PontosAtencao({
  banco,
  de,
  ate,
  pessoaSel,
  onSelecionar,
  onVoltar,
  onAbrirEvento,
}: {
  banco: BancoMock;
  de: Date;
  ate: Date;
  pessoaSel: string | null;
  onSelecionar: (usuarioId: string) => void;
  onVoltar: () => void;
  onAbrirEvento: (e: EventoAuditoria) => void;
}) {
  const pontos = useMemo(() => pontosDeAtencao(banco, de, ate), [banco, de, ate]);

  if (pessoaSel) {
    const ponto = pontos.find((p) => p.usuarioId === pessoaSel);
    if (ponto) {
      return (
        <PessoaView
          ponto={ponto}
          banco={banco}
          de={de}
          ate={ate}
          onVoltar={onVoltar}
          onAbrirEvento={onAbrirEvento}
        />
      );
    }
  }

  if (pontos.length === 0) {
    return <EstadoVazio titulo="Sem dados no período" descricao="Os indicadores da equipe aparecem aqui." />;
  }

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 rounded-[14px] border border-border bg-secondary/40 px-3.5 py-2.5 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        Indicadores de cada pessoa comparados com a média da equipe. Servem para acompanhar,
        não para acusar.
      </p>
      <ul className="space-y-2">
        {pontos.map((p) => (
          <li key={p.usuarioId}>
            <button
              type="button"
              onClick={() => onSelecionar(p.usuarioId)}
              className="w-full rounded-[16px] border border-border bg-card p-4 text-left transition-colors hover:border-cereja/30"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">{p.nome}</p>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <Indicador rotulo="Cancelamentos" valor={p.cancelamentos} />
                <Indicador rotulo="Descontos" valor={p.descontos} />
                <Indicador rotulo="Caixa c/ diferença" valor={p.caixaDiferencas} />
              </div>
              {p.observacoes.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {p.observacoes.map((o, i) => (
                    <li
                      key={i}
                      className={cn(
                        "text-sm",
                        o.startsWith("Dentro da média") ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {o}
                    </li>
                  ))}
                </ul>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <span>
      {rotulo}: <span className="font-semibold text-foreground tnum">{valor}</span>
    </span>
  );
}

function PessoaView({
  ponto,
  banco,
  de,
  ate,
  onVoltar,
  onAbrirEvento,
}: {
  ponto: PontoAtencao;
  banco: BancoMock;
  de: Date;
  ate: Date;
  onVoltar: () => void;
  onAbrirEvento: (e: EventoAuditoria) => void;
}) {
  const eventos = useMemo(() => {
    const deMs = de.getTime();
    const ateMs = ate.getTime();
    return banco.eventos
      .filter((e) => {
        const t = new Date(e.data).getTime();
        return e.usuarioId === ponto.usuarioId && t >= deMs && t <= ateMs;
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [banco.eventos, ponto.usuarioId, de, ate]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onVoltar}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </button>

      <div className="rounded-[18px] border border-border bg-card p-5">
        <h2 className="font-display text-2xl leading-tight">{ponto.nome}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metrica rotulo="Cancelamentos" valor={ponto.cancelamentos} />
          <Metrica rotulo="Descontos" valor={ponto.descontos} />
          <Metrica rotulo="Cortesias" valor={ponto.cortesias} />
          <Metrica rotulo="Caixa c/ diferença" valor={ponto.caixaDiferencas} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Impacto financeiro no período: {formatBRL(ponto.valorImpacto)}
        </p>
        {ponto.observacoes.length > 0 && (
          <ul className="mt-3 space-y-1">
            {ponto.observacoes.map((o, i) => (
              <li key={i} className="text-sm text-foreground">
                • {o}
              </li>
            ))}
          </ul>
        )}
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Linha do tempo</h3>
        {eventos.length === 0 ? (
          <EstadoVazio titulo="Sem eventos" descricao="Nenhum registro desta pessoa no período." tom="cereja" />
        ) : (
          <ul className="space-y-2">
            {eventos.map((e) => (
              <EventoLinha key={e.id} evento={e} banco={banco} onClick={() => onAbrirEvento(e)} />
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2 rounded-[14px] border border-azulejo/25 bg-azulejo/8 px-3.5 py-3 text-sm text-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-azulejo" />
        {OBSERVACAO_FIXA}
      </p>
    </div>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-[14px] bg-secondary/50 p-3 text-center">
      <p className="font-display text-2xl tnum">{valor}</p>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
    </div>
  );
}
