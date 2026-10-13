"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useDadosStore, useSessaoStore } from "@/lib/store";

export function SinoAlertas() {
  const eventos = useDadosStore((s) => s.eventos);
  const lojaAtiva = useSessaoStore((s) => s.lojaAtiva);

  // Valor estável (calculado uma vez) — evita impureza de Date.now no render.
  const [corte] = useState(() =>
    new Date(Date.now() - 7 * 86400_000).toISOString(),
  );
  const graves = eventos.filter(
    (e) =>
      (e.severidade === "critico" || e.severidade === "atencao") &&
      e.data >= corte &&
      (lojaAtiva === "todas" || e.lojaId === lojaAtiva),
  ).length;

  return (
    <Link
      href="/auditoria"
      aria-label={`Alertas${graves ? `: ${graves}` : ""}`}
      className="relative grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Bell className="size-5" strokeWidth={1.75} />
      {graves > 0 && (
        <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-alerta px-1 text-[10px] font-semibold leading-4 text-white tnum">
          {graves > 99 ? "99+" : graves}
        </span>
      )}
    </Link>
  );
}
