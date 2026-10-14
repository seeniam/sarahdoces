"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { formatDataCurta } from "@/lib/format";
import type { PontoFluxo } from "@/lib/domain";

export function FluxoChart({ dados }: { dados: PontoFluxo[] }) {
  const fmtDia = (dia: string) => formatDataCurta(`${dia}T12:00:00-03:00`);
  const kBrl = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barGap={2}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="dia"
          tickFormatter={fmtDia}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={kBrl}
        />
        <Tooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
          content={
            <ChartTooltip
              moeda
              rotulos={{ entradas: "Entradas", saidas: "Saídas", saldoAcumulado: "Saldo acumulado" }}
              titulo={(l) => fmtDia(String(l))}
            />
          }
        />
        <Bar dataKey="entradas" fill="var(--color-pistache)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="saidas" fill="var(--color-alerta)" radius={[3, 3, 0, 0]} />
        <Line
          type="monotone"
          dataKey="saldoAcumulado"
          stroke="var(--color-azulejo)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
