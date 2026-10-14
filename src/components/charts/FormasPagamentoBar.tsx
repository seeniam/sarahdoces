"use client";

import { formatBRL, formatPorcentagem } from "@/lib/format";
import type { FatiaPagamento } from "@/lib/domain";
import type { FormaPagamento } from "@/types";

const ROTULO: Record<FormaPagamento, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
};
// Paleta CATEGÓRICA (não é a da marca nem a de status): formas de pagamento são
// categorias, não bom/ruim. Dinheiro NÃO é o verde de "positivo". Tons médios,
// legíveis no claro e no escuro.
const COR: Record<FormaPagamento, string> = {
  pix: "#0FA3A3", // teal
  dinheiro: "#6B82A0", // azul-ardósia (neutro)
  debito: "#7C5CBF", // roxo
  credito: "#D1477A", // rosa-magenta
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
            className="h-full"
            style={{ width: `${d.fracao * 100}%`, backgroundColor: COR[d.forma] }}
            title={`${ROTULO[d.forma]}: ${formatBRL(d.valor)}`}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {comValor.map((d) => (
          <li key={d.forma} className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: COR[d.forma] }} />
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
