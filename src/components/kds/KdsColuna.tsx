"use client";

import { AnimatePresence } from "framer-motion";
import { KdsCartao } from "./KdsCartao";
import type { Comanda, StatusComanda } from "@/types";

export function KdsColuna({
  titulo,
  comandas,
  agora,
  onAvancar,
  onEntregue,
  destaques,
}: {
  titulo: string;
  comandas: Comanda[];
  agora: number;
  onAvancar: (c: Comanda, proximo: StatusComanda) => void;
  onEntregue: (c: Comanda) => void;
  destaques: Set<string>;
}) {
  return (
    <section className="flex min-h-0 w-[82vw] max-w-sm shrink-0 flex-col sm:w-auto sm:max-w-none sm:min-w-[14rem] sm:flex-1">
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-xl text-white">{titulo}</h2>
        <span className="grid min-w-7 place-items-center rounded-full bg-white/10 px-2 py-0.5 text-sm font-semibold text-white tnum">
          {comandas.length}
        </span>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4 pr-0.5">
        <AnimatePresence initial={false}>
          {comandas.map((c) => (
            <KdsCartao
              key={c.id}
              comanda={c}
              agora={agora}
              onAvancar={onAvancar}
              onEntregue={onEntregue}
              destaque={destaques.has(c.id)}
            />
          ))}
        </AnimatePresence>

        {comandas.length === 0 && (
          <p className="rounded-[14px] border border-dashed border-white/15 px-4 py-10 text-center text-sm text-white/45">
            Sem pedidos aqui.
          </p>
        )}
      </div>
    </section>
  );
}
