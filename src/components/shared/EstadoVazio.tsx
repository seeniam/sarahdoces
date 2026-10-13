import { cn } from "cn";
import { azulejoDataUri } from "@/lib/brand/azulejo";

type Tom = "azulejo" | "cereja" | "cacau";

const CORES: Record<Tom, string> = {
  azulejo: "#1E4F91",
  cereja: "#9E1B32",
  cacau: "#2B1B18",
};

/**
 * Estado vazio da direção de arte §4: UM azulejo grande + frase curta + ação.
 * (Não é o padrão repetido cobrindo o card.)
 */
export function EstadoVazio({
  titulo,
  descricao,
  tom = "azulejo",
  acao,
  className,
}: {
  titulo: string;
  descricao: string;
  tom?: Tom;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 px-6 py-16 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="size-36 opacity-70"
        style={{
          backgroundImage: azulejoDataUri({ color: CORES[tom], strokeWidth: 1.1 }),
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />
      <div className="max-w-sm space-y-1.5">
        <h2 className="font-display text-xl text-foreground">{titulo}</h2>
        <p className="text-sm text-muted-foreground">{descricao}</p>
      </div>
      {acao}
    </div>
  );
}
