import { Azulejo } from "@/components/brand/Azulejo";

/**
 * Estado "em construção" com azulejo, para as telas que chegam nas próximas
 * fases. Tem personalidade — não é uma página em branco.
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
    <div className="relative grid min-h-[60vh] place-items-center overflow-hidden rounded-[20px] border border-border bg-card shadow-soft">
      <Azulejo tom="cereja" opacity={0.07} tile={128} className="absolute inset-0" />
      <div className="relative max-w-sm space-y-2 px-8 text-center">
        <h1 className="font-display text-3xl text-foreground">{titulo}</h1>
        <p className="text-sm text-muted-foreground">{descricao}</p>
        {fase && (
          <p className="pt-1 text-xs font-medium text-cereja">Chega na {fase}.</p>
        )}
      </div>
    </div>
  );
}
