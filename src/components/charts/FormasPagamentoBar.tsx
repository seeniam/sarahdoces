"use client";

import { cn } from "cn";
import { formatBRL, formatPorcentagem } from "@/lib/format";
import type { FatiaPagamento } from "@/lib/domain";
import type { FormaPagamento } from "@/types";

const ROTULO: Record<FormaPagamento, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
};
// Tons distintos dentro da marca (cereja → azulejo → folha → caramelo).
const COR: Record<FormaPagamento, string> = {
  pix: "bg-cereja",
  dinheiro: "bg-pistache",
  debito: "bg-azulejo",
  credito: "bg-doce-de-leite",
};
const PONTO: Record<FormaPagamento, string> = {
  pix: "bg-cereja",
  dinheiro: "bg-pistache",
  debito: "bg-azulejo",
  credito: "bg-doce-de-leite",
};

export function FormasPagamentoBar({ dados }: { dados: FatiaPagamento[] }) {
  const comValor = dados.filter((d) => d.valor > 0);
  if (comValor.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sem pagamentos.</p>;
  }
  return (
    <div>
      <div className="flex h-5 w-full overflow-hidden rounded-full">
        {comValor.map((d) => (
          <div
            key={d.forma}
            className={cn("h-full", COR[d.forma])}
            style={{ width: `${d.fracao * 100}%` }}
            title={`${ROTULO[d.forma]}: ${formatBRL(d.valor)}`}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {comValor.map((d) => (
          <li key={d.forma} className="flex items-center gap-2">
            <span className={cn("size-2 shrink-0 rounded-full", PONTO[d.forma])} />
            <span className="text-muted-foreground">{ROTULO[d.forma]}</span>
            <span className="ml-auto font-semibold text-foreground tnum">
              {formatPorcentagem(d.fracao, 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
