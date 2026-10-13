import { EstadoVazio } from "./EstadoVazio";

/**
 * Placeholder temporário das telas que chegam nas próximas fases.
 * Usa o EstadoVazio definitivo (um azulejo grande + frase + nota da fase).
 */
export function Placeholder({
  titulo,
  descricao,
  fase,
}: {
  titulo: string;
  descricao: string;
  fase?: string;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center rounded-[20px] border border-border bg-card shadow-soft">
      <EstadoVazio
        titulo={titulo}
        descricao={descricao}
        acao={
          fase ? (
            <span className="rounded-full bg-acucar px-3 py-1 text-xs font-medium text-cereja-calda">
              Chega na {fase}
            </span>
          ) : undefined
        }
      />
    </div>
  );
}
