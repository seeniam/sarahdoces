import { cn } from "cn";
import { formatBRLValor } from "@/lib/format";

export interface NumeroHeroiProps {
  valor: number;
  /** Formata como moeda com "R$" menor (60%) alinhado ao topo. */
  moeda?: boolean;
  /** Dígitos para número puro (não-moeda). */
  casas?: number;
  tamanho?: "hero" | "grande" | "medio";
  className?: string;
}

const TAMANHO = {
  hero: "text-[clamp(2.75rem,6vw,3.8rem)]", // ~44–61px
  grande: "text-[clamp(2rem,4vw,2.75rem)]",
  medio: "text-[1.75rem]",
};

/** Número-herói em Gloock, com R$ reduzido. */
export function NumeroHeroi({
  valor,
  moeda = true,
  casas = 0,
  tamanho = "hero",
  className,
}: NumeroHeroiProps) {
  const texto = moeda
    ? formatBRLValor(valor)
    : new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas,
      }).format(valor);

  return (
    <span
      className={cn(
        "font-display leading-none tracking-tight tnum inline-flex items-start text-foreground",
        TAMANHO[tamanho],
        className,
      )}
    >
      {moeda && (
        <span className="mr-1 mt-[0.12em] text-[0.6em] font-medium text-muted-foreground">
          R$
        </span>
      )}
      {texto}
    </span>
  );
}
