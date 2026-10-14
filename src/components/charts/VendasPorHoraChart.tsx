"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import type { PontoHora } from "@/lib/domain";

export function VendasPorHoraChart({ dados }: { dados: PontoHora[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="gradHoje" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-cereja)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-cereja)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="hora"
          tickFormatter={(h) => `${h}h`}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
        />
        <Tooltip
          content={
            <ChartTooltip
              rotulos={{ hoje: "Hoje", media: "Média 4 sem." }}
              titulo={(l) => `${l}h`}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="hoje"
          stroke="var(--color-cereja)"
          strokeWidth={2.5}
          fill="url(#gradHoje)"
        />
        <Line
          type="monotone"
          dataKey="media"
          stroke="var(--color-azulejo)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
