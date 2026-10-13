import { cn } from "cn";

/**
 * Marca de duas cerejas — desenho original (não é clip-art). As cores vêm das
 * variáveis de marca, então o símbolo se adapta ao tema (cereja clareia no
 * modo cacau, o talo inverte para contraste).
 *
 * Quando o Neemias colocar o logo real em `public/brand/logo.png`, trocar a
 * marca por <Image> aqui (ver docs/PENDENCIAS-CLIENTE.md).
 */
export function CerejaMark({
  className,
  mono = false,
}: {
  className?: string;
  /** Monocromático (currentColor) — para a comanda térmica em preto. */
  mono?: boolean;
}) {
  const fruta = mono ? "currentColor" : "var(--cereja)";
  const folha = mono ? "currentColor" : "var(--pistache)";
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Duas cerejas"
      fill="none"
    >
      {/* Talos */}
      <path
        d="M17 25 C18 18 24 13 30 9"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M32 28 C34 20 31 13 30 9"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Folha */}
      <path d="M30 9 C34 3 41 4 43 9 C39 12 32 12 30 9 Z" fill={folha} />
      {/* Cerejas */}
      <circle cx="17" cy="34" r="9" fill={fruta} />
      <circle cx="32" cy="36" r="8" fill={fruta} />
      {/* Brilho de calda (só na versão colorida) */}
      {!mono && (
        <>
          <ellipse cx="14" cy="31" rx="2.6" ry="3.4" fill="#FFFFFF" opacity="0.4" />
          <ellipse cx="29.5" cy="33.5" rx="2.2" ry="3" fill="#FFFFFF" opacity="0.35" />
        </>
      )}
    </svg>
  );
}

type Variante = "completa" | "compacta" | "marca";

export interface LogoProps {
  variante?: Variante;
  /** Mostra "Café & Confeitaria Artesanal". */
  tagline?: boolean;
  className?: string;
  /** Classe aplicada ao nome (ex.: cor sobre a sidebar). */
  textClassName?: string;
  /** Classe aplicada à linha "Café & Confeitaria Artesanal". */
  taglineClassName?: string;
}

export function Logo({
  variante = "completa",
  tagline = true,
  className,
  textClassName,
  taglineClassName,
}: LogoProps) {
  if (variante === "marca") {
    return <CerejaMark className={cn("size-9", className)} />;
  }

  const empilhado = variante === "completa";

  return (
    <div
      className={cn(
        "flex items-center",
        empilhado ? "gap-3" : "gap-2.5",
        className,
      )}
    >
      <CerejaMark className={empilhado ? "size-11 shrink-0" : "size-8 shrink-0"} />
      <div className={cn("flex flex-col leading-none", textClassName)}>
        <span
          className={cn(
            "font-display tracking-tight",
            empilhado ? "text-xl" : "text-lg",
          )}
        >
          Sarah Rangel
        </span>
        {tagline && empilhado && (
          <span
            className={cn(
              "mt-1 text-[11px] font-medium text-muted-foreground",
              taglineClassName,
            )}
          >
            Café &amp; Confeitaria Artesanal
          </span>
        )}
      </div>
    </div>
  );
}
