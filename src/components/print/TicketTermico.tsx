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

export type ViaComanda = "cozinha" | "cliente";

/**
 * Comanda térmica 80mm, monocromática (imprime bem). Duas vias:
 * - "cozinha": SEM preços; mesa/cliente enorme; quantidades em Gloock grande;
 *   adicionais e observações em negrito invertido (branco no preto).
 * - "cliente": com preços e totais.
 * A classe `ticket-print` é isolada pelo CSS de impressão (@page 80mm).
 */
export function TicketTermico({
  comanda,
  atendenteNome,
  via = "cozinha",
  className,
}: {
  comanda: Comanda;
  atendenteNome: string;
  via?: ViaComanda;
  className?: string;
}) {
  const comPreco = via === "cliente";
  const subtotal = comanda.itens.reduce((s, it) => s + it.precoUnit * it.qtd, 0);
  const total = Math.max(0, subtotal - (comanda.desconto ?? 0));
  const numero = `#${String(comanda.numero).padStart(4, "0")}`;
  const alvo = `${TIPO_LABEL[comanda.tipo]}${
    comanda.identificador ? ` ${comanda.identificador}` : ""
  }`;

  return (
    <div
      className={cn(
        "ticket-print serrilha-baixo w-[80mm] bg-white pb-7 text-[#121212]",
        className,
      )}
    >
      {/* Faixa de azulejo em preto */}
      <div
        aria-hidden
        className="h-6 w-full"
        style={azulejoBackground({ color: "#121212", strokeWidth: 1.1, size: 34 })}
      />

      <div className="px-5 pt-4">
        <div className="flex items-center justify-center gap-2">
          <CerejaMark mono className="size-5" />
          <span className="font-display text-base">Sarah Rangel</span>
        </div>

        {via === "cozinha" ? (
          <>
            {/* Alvo enorme: MESA 4 */}
            <p className="mt-3 text-center font-display text-4xl uppercase leading-none">
              {alvo}
            </p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-display text-lg tnum">{numero}</span>
              <span className="tnum">{formatHora(comanda.criadaEm)}</span>
            </div>
            <p className="text-xs text-[#121212]/70">Atendente: {atendenteNome}</p>
          </>
        ) : (
          <>
            <div className="mt-3 text-center">
              <p className="text-[11px] text-[#121212]/55">Comanda</p>
              <p className="font-display text-5xl leading-none tnum">{numero}</p>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-semibold uppercase">{alvo}</span>
              <span className="tnum">{formatHora(comanda.criadaEm)}</span>
            </div>
            <p className="text-xs text-[#121212]/70">Atendente: {atendenteNome}</p>
          </>
        )}

        {/* Itens */}
        <div className="my-3 border-y border-dashed border-[#121212]/35 py-3">
          <ul className="space-y-3">
            {comanda.itens.map((item, i) => {
              const produto = PRODUTO_POR_ID.get(item.produtoId);
              return (
                <li key={i} className="flex items-start gap-2.5">
                  {/* Quantidade e "×" com o mesmo peso — multiplicador real, não
                      um sinalzinho (o × do display serif sai miúdo demais). */}
                  <span className="flex items-baseline gap-0.5 leading-none">
                    <span className="font-display text-xl tnum">{item.qtd}</span>
                    <span className="text-lg font-semibold">×</span>
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p
                      className={cn(
                        "leading-tight",
                        via === "cozinha"
                          ? "font-display text-lg"
                          : "text-sm font-medium",
                      )}
                    >
                      {produto?.nome ?? item.produtoId}
                    </p>
                    {item.adicionais.map((a) => (
                      <p key={a.id} className="text-xs font-bold">
                        + {a.nome}
                      </p>
                    ))}
                    {item.obs && (
                      <span className="mt-1 inline-block bg-[#121212] px-1.5 py-0.5 text-xs font-bold text-white">
                        obs: {item.obs}
                      </span>
                    )}
                  </div>
                  {comPreco && (
                    <span className="pt-0.5 text-sm tnum">
                      {formatBRL(item.precoUnit * item.qtd)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {comPreco && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-[#121212]/70">
              <span>Subtotal</span>
              <span className="tnum">{formatBRL(subtotal)}</span>
            </div>
            {comanda.desconto ? (
              <div className="flex justify-between text-[#121212]/70">
                <span>{comanda.cortesia ? "Cortesia" : "Desconto"}</span>
                <span className="tnum">−{formatBRL(comanda.desconto)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="tnum">{formatBRL(total)}</span>
            </div>
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-[#121212]/55">
          Sem comanda, não sai prato.
        </p>
      </div>
    </div>
  );
}
