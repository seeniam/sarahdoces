"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useDadosStore, useSessaoStore } from "@/lib/store";
import { alertasPainel } from "@/lib/domain";
import type { DadosState } from "@/lib/store";

export function SinoAlertas() {
  const banco = useDadosStore() as DadosState;
  const lojaAtiva = useSessaoStore((s) => s.lojaAtiva);
  // Instante estável (uma vez por montagem) — evita impureza de Date no render.
  const [agora] = useState(() => new Date());

  // O badge conta só o que a Sarah PRECISA agir: os alertas concretos do painel
  // (cancelamentos acima da média, divergência de estoque, caixa com diferença),
  // não cada evento solto — senão vira ruído.
  const total = useMemo(
    () => alertasPainel(banco, lojaAtiva, agora).length,
    [banco, lojaAtiva, agora],
  );

  return (
    <Link
      href="/auditoria"
      aria-label={`Alertas${total ? `: ${total}` : ""}`}
      className="relative grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Bell className="size-5" strokeWidth={1.75} />
      {total > 0 && (
        <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-alerta px-1 text-[10px] font-semibold leading-4 text-white tnum">
          {total > 9 ? "9+" : total}
        </span>
      )}
    </Link>
  );
}
