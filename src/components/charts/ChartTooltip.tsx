"use client";

import type { ReactNode } from "react";
import { formatBRL } from "@/lib/format";

interface Item {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

/** Tooltip da marca: fundo card, valores em BRL pt-BR. */
export function ChartTooltip({
  active,
  payload,
  label,
  rotulos,
  titulo,
  moeda = true,
}: {
  active?: boolean;
  payload?: Item[];
  label?: ReactNode;
  /** dataKey → rótulo legível. */
  rotulos?: Record<string, string>;
  /** Formata o título (ex.: "9h"). */
  titulo?: (label: ReactNode) => string;
  moeda?: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const itens = payload.filter((it) => it.value != null);
  if (itens.length === 0) return null;
  return (
    <div className="rounded-[10px] border border-border bg-card px-3 py-2 text-xs shadow-soft">
      {label != null && (
        <p className="mb-1 font-medium text-foreground">
          {titulo ? titulo(label) : label}
        </p>
      )}
      <ul className="space-y-0.5">
        {itens.map((it, i) => {
          const key = String(it.dataKey ?? it.name ?? i);
          const nome = rotulos?.[key] ?? it.name ?? key;
          const v = typeof it.value === "number" ? it.value : Number(it.value) || 0;
          return (
            <li key={i} className="flex items-center gap-2 tnum">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: it.color }}
              />
              <span className="text-muted-foreground">{nome}</span>
              <span className="ml-auto font-semibold text-foreground">
                {moeda ? formatBRL(v) : v.toLocaleString("pt-BR")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
