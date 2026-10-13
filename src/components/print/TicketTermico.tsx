import { cn } from "cn";
import type { Comanda } from "@/types";
import { PRODUTO_POR_ID } from "@/lib/mock/data";
import { azulejoBackground } from "@/lib/brand/azulejo";
import { CerejaMark } from "@/components/brand/Logo";
import { formatBRL, formatHora } from "@/lib/format";

const TIPO_LABEL: Record<Comanda["tipo"], string> = {
  mesa: "Mesa",
  balcao: "Balcão",
  viagem: "Viagem",
};

/**
 * Comanda térmica 80mm. "Papel" branco com faixa de azulejo em preto (imprime
 * bem), nº em Gloock, QUANTIDADES em destaque e observações em negrito.
 * A classe `ticket-print` é isolada pelo CSS de impressão (@page 80mm).
 */
export function TicketTermico({
  comanda,
  atendenteNome,
  className,
}: {
  comanda: Comanda;
  atendenteNome: string;
  className?: string;
}) {
  const subtotal = comanda.itens.reduce(
    (s, it) => s + it.precoUnit * it.qtd,
    0,
  );
  const total = Math.max(0, subtotal - (comanda.desconto ?? 0));

  return (
    <div
      className={cn(
        "ticket-print serrilha-baixo w-[80mm] bg-white pb-6 text-[#161616]",
        className,
      )}
    >
      {/* Faixa de azulejo em preto */}
      <div
        aria-hidden
        className="h-6 w-full"
        style={azulejoBackground({ color: "#161616", strokeWidth: 1.1, size: 34 })}
      />

      <div className="px-5 pt-4">
        {/* Marca */}
        <div className="flex items-center justify-center gap-2 text-[#161616]">
          <CerejaMark className="size-5" />
          <span className="font-display text-base">Sarah Rangel</span>
        </div>

        {/* Número */}
        <div className="mt-3 text-center">
          <p className="text-[11px] text-[#161616]/55">Comanda</p>
          <p className="font-display text-5xl leading-none tnum">
            #{String(comanda.numero).padStart(4, "0")}
          </p>
        </div>

        {/* Cabeçalho */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold">
            {TIPO_LABEL[comanda.tipo]}
            {comanda.identificador ? ` ${comanda.identificador}` : ""}
          </span>
          <span className="tnum">{formatHora(comanda.criadaEm)}</span>
        </div>
        <p className="text-xs text-[#161616]/70">Atendente: {atendenteNome}</p>

        {/* Itens */}
        <div className="my-3 border-y border-dashed border-[#161616]/30 py-3">
          <ul className="space-y-2.5">
            {comanda.itens.map((item, i) => {
              const produto = PRODUTO_POR_ID.get(item.produtoId);
              return (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="font-display text-lg leading-none tnum">
                    {item.qtd}×
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">
                      {produto?.nome ?? item.produtoId}
                    </p>
                    {item.adicionais.map((a) => (
                      <p key={a.id} className="text-xs text-[#161616]/70">
                        + {a.nome}
                      </p>
                    ))}
                    {item.obs && (
                      <p className="text-xs font-bold">obs: {item.obs}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Totais */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-[#161616]/70">
            <span>Subtotal</span>
            <span className="tnum">{formatBRL(subtotal)}</span>
          </div>
          {comanda.desconto ? (
            <div className="flex justify-between text-[#161616]/70">
              <span>{comanda.cortesia ? "Cortesia" : "Desconto"}</span>
              <span className="tnum">−{formatBRL(comanda.desconto)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="tnum">{formatBRL(total)}</span>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-[#161616]/55">
          Sem comanda, não sai prato.
        </p>
      </div>
    </div>
  );
}
