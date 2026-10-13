import { cn } from "cn";

type Variante = "ok" | "atencao" | "critico" | "info" | "neutro";

const CORES: Record<Variante, string> = {
  ok: "var(--pistache)",
  atencao: "var(--doce-de-leite)",
  critico: "var(--alerta)",
  info: "var(--azulejo)",
  neutro: "var(--muted-foreground)",
};

export interface StatusBadgeProps {
  variante?: Variante;
  children: React.ReactNode;
  className?: string;
}

/** Badge de status: ponto colorido + texto (nunca só cor). */
export function StatusBadge({
  variante = "neutro",
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground",
        className,
      )}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: CORES[variante] }}
      />
      {children}
    </span>
  );
}
