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
import type { PontoVendaPerda } from "@/lib/domain";

export function VendaPerdaChart({ dados }: { dados: PontoVendaPerda[] }) {
  const fmtDia = (dia: string) => formatDataCurta(`${dia}T12:00:00-03:00`);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barGap={1}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="dia"
          tickFormatter={fmtDia}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={2}
        />
        <YAxis
          yAxisId="venda"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
        />
        {/* Eixo próprio da perda (pequena perto da venda) — fica legível. */}
        <YAxis yAxisId="perda" orientation="right" hide />
        <Tooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
          content={
            <ChartTooltip
              rotulos={{ venda: "Venda", perda: "Perda" }}
              titulo={(l) => fmtDia(String(l))}
            />
          }
        />
        <Bar yAxisId="venda" dataKey="venda" fill="var(--color-cereja)" radius={[3, 3, 0, 0]} />
        {/* Perda: linha tracejada âmbar (doce-de-leite) — cor e traço distintos
            das barras de venda (cereja), para não se confundir. */}
        <Line
          yAxisId="perda"
          type="monotone"
          dataKey="perda"
          stroke="var(--color-doce-de-leite)"
          strokeWidth={2.5}
          strokeDasharray="5 3"
          dot={{ r: 2.5, fill: "var(--color-doce-de-leite)", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
