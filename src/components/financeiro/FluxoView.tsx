"use client";

import { cn } from "cn";
import { FluxoChart } from "@/components/charts/FluxoChart";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { formatBRL, formatBRLSinalado, formatDataCurta } from "@/lib/format";
import type { ResumoFluxo } from "@/lib/domain";

export function FluxoView({ fluxo }: { fluxo: ResumoFluxo }) {
  if (fluxo.pontos.length === 0) {
    return (
      <EstadoVazio
        titulo="Sem movimento no período"
        descricao="Entradas (vendas) e saídas (compras e contas) aparecem aqui dia a dia."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Kpi rotulo="Entradas" valor={formatBRL(fluxo.totalEntradas)} classe="text-pistache" />
        <Kpi rotulo="Saídas" valor={formatBRL(fluxo.totalSaidas)} classe="text-alerta" />
        <Kpi
          rotulo="Saldo"
          valor={formatBRLSinalado(fluxo.saldo)}
          classe={fluxo.saldo >= 0 ? "text-foreground" : "text-alerta"}
        />
      </div>

      <div className="rounded-[20px] border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <Legenda cor="bg-pistache" rotulo="Entradas" />
          <Legenda cor="bg-alerta" rotulo="Saídas" />
          <Legenda cor="bg-azulejo" rotulo="Saldo acumulado" linha />
        </div>
        <div className="h-64">
          <FluxoChart dados={fluxo.pontos} />
        </div>
      </div>

      {/* Lista diária (desktop) */}
      <div className="hidden overflow-hidden rounded-[18px] border border-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Dia</th>
              <th className="px-4 py-2.5 text-right font-medium">Entradas</th>
              <th className="px-4 py-2.5 text-right font-medium">Saídas</th>
              <th className="px-4 py-2.5 text-right font-medium">Resultado</th>
              <th className="px-4 py-2.5 text-right font-medium">Saldo acumulado</th>
            </tr>
          </thead>
          <tbody>
            {[...fluxo.pontos].reverse().map((p) => (
              <tr key={p.dia} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5">{formatDataCurta(`${p.dia}T12:00:00-03:00`)}</td>
                <td className="px-4 py-2.5 text-right tnum text-pistache">{formatBRL(p.entradas)}</td>
                <td className="px-4 py-2.5 text-right tnum text-alerta">{formatBRL(p.saidas)}</td>
                <td className={cn("px-4 py-2.5 text-right tnum", p.resultado < 0 && "text-alerta")}>
                  {formatBRLSinalado(p.resultado)}
                </td>
                <td className="px-4 py-2.5 text-right tnum">{formatBRL(p.saldoAcumulado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista diária (mobile): cartões */}
      <ul className="space-y-2 md:hidden">
        {[...fluxo.pontos].reverse().map((p) => (
          <li key={p.dia} className="rounded-[16px] border border-border bg-card p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                {formatDataCurta(`${p.dia}T12:00:00-03:00`)}
              </span>
              <span className={cn("tnum text-sm", p.resultado < 0 && "text-alerta")}>
                {formatBRLSinalado(p.resultado)}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="tnum text-pistache">{formatBRL(p.entradas)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saídas</p>
                <p className="tnum text-alerta">{formatBRL(p.saidas)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Saldo acum.</p>
                <p className="tnum">{formatBRL(p.saldoAcumulado)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Kpi({ rotulo, valor, classe }: { rotulo: string; valor: string; classe?: string }) {
  return (
    <div className="rounded-[16px] border border-border bg-card p-3.5">
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className={cn("mt-1 font-display text-lg tnum sm:text-xl", classe)}>{valor}</p>
    </div>
  );
}

function Legenda({ cor, rotulo, linha }: { cor: string; rotulo: string; linha?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn(cor, linha ? "h-0.5 w-4 rounded-full" : "size-2.5 rounded-full")} />
      {rotulo}
    </span>
  );
}
