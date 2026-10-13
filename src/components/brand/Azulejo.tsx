import { azulejoBackground } from "@/lib/brand/azulejo";
import { cn } from "cn";

type Tom = "azulejo" | "cereja" | "branco" | "cacau";

const CORES: Record<Tom, string> = {
  azulejo: "#1E4F91",
  cereja: "#9E1B32",
  branco: "#FFFFFF",
  cacau: "#2B1B18",
};

export interface AzulejoProps {
  /** Tom do traço. Em superfícies escuras use "branco". */
  tom?: Tom;
  opacity?: number;
  /** Tamanho do ladrilho em px. */
  tile?: number;
  strokeWidth?: number;
  /** Esmaece o padrão por baixo (rodapé da sidebar). */
  fade?: "bottom" | "top" | "none";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Parede de azulejo: preenche o contêiner com o módulo repetido.
 * Vetor (SVG), portanto nítido em qualquer tamanho.
 */
export function Azulejo({
  tom = "azulejo",
  opacity = 1,
  tile = 72,
  strokeWidth = 1.4,
  fade = "none",
  className,
  style,
}: AzulejoProps) {
  const mask =
    fade === "bottom"
      ? "linear-gradient(to bottom, transparent, black 45%)"
      : fade === "top"
        ? "linear-gradient(to top, transparent, black 45%)"
        : undefined;

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none", className)}
      style={{
        ...azulejoBackground({
          color: CORES[tom],
          opacity,
          strokeWidth,
          size: tile,
        }),
        ...(mask ? { maskImage: mask, WebkitMaskImage: mask } : null),
        ...style,
      }}
    />
  );
}
