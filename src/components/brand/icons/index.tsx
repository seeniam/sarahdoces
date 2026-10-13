import type { SVGProps } from "react";

/**
 * Ícones de linha próprios das categorias do PDV (xícara, cuscuzeira, prato,
 * coxa de frango, copo de suco, fatia de bolo). Traço 1.5, grade 24,
 * currentColor — mesma linguagem do lucide-react, mas desenhados por nós.
 */

type IconeProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconeProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** Café da manhã — xícara com pires e vapor. */
export function IconeXicara(props: IconeProps) {
  return (
    <Base {...props}>
      <path d="M4.5 8.5h11v4.5a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4z" />
      <path d="M15.5 9.5h2a2.5 2.5 0 0 1 0 5h-2" />
      <path d="M4 20.5h13" />
      <path d="M8 3c.8.8.8 1.7 0 2.6" />
      <path d="M11.5 3c.8.8.8 1.7 0 2.6" />
    </Base>
  );
}

/** Cuscuz — cuscuzeira com cúpula, pegador e vapor. */
export function IconeCuscuzeira(props: IconeProps) {
  return (
    <Base {...props}>
      <path d="M4.5 12h15v3.5a3.5 3.5 0 0 1-3.5 3.5h-8A3.5 3.5 0 0 1 4.5 15.5z" />
      <path d="M5 12a7 7 0 0 1 14 0" />
      <path d="M12 5V3.2" />
      <circle cx="12" cy="3" r="0.6" fill="currentColor" stroke="none" />
      <path d="M9 8.5c.7.6.7 1.3 0 1.9" />
      <path d="M15 8.5c.7.6.7 1.3 0 1.9" />
    </Base>
  );
}

/** PF & Pratos — prato com garfo e faca. */
export function IconePrato(props: IconeProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="13" r="6.2" />
      <circle cx="12" cy="13" r="3" />
      <path d="M3.5 4v5.2a1.8 1.8 0 0 0 3.6 0V4" />
      <path d="M5.3 4v16" />
      <path d="M20.5 4c-1.6 0-2.3 2-2.3 4.3 0 1.7 1 2.3 2.3 2.4z" />
      <path d="M20.3 10.7V20" />
    </Base>
  );
}

/** Porções — coxa de frango. */
export function IconeFrango(props: IconeProps) {
  return (
    <Base {...props}>
      <path d="M15.5 4.5a4.5 4.5 0 0 1 3.2 7.7c-1.6 1.6-3.8 1.4-5.2 2.1-1 .5-1.4 1.7-2.5 2.8" />
      <path d="M11 17.1a4 4 0 1 0-2.6 2.6" />
      <path d="M7.2 16.8 4.6 19.4" />
      <path d="m6.1 15 -2 2" />
    </Base>
  );
}

/** Bebidas — copo de suco com canudo. */
export function IconeSuco(props: IconeProps) {
  return (
    <Base {...props}>
      <path d="M6.5 4.5h11l-1.4 15.1a1.5 1.5 0 0 1-1.5 1.4H9.4a1.5 1.5 0 0 1-1.5-1.4z" />
      <path d="M7.1 9.5h9.8" />
      <path d="M13.5 2.5 11.8 9.5" />
    </Base>
  );
}

/** Doces & Bolos — fatia de bolo com cereja. */
export function IconeBolo(props: IconeProps) {
  return (
    <Base {...props}>
      <path d="M4.5 20V11l7.5-2 7.5 2v9z" />
      <path d="M4.5 11c1.6 1.2 3.1 1.2 4.7 0 1.6 1.2 3.1 1.2 4.7 0 1.6 1.2 3.1 1.2 4.6 0" />
      <path d="M12 9V6.5" />
      <circle cx="12" cy="5.4" r="1.3" />
    </Base>
  );
}

export const ICONES_CATEGORIA = {
  xicara: IconeXicara,
  cuscuzeira: IconeCuscuzeira,
  prato: IconePrato,
  frango: IconeFrango,
  suco: IconeSuco,
  bolo: IconeBolo,
} as const;

export type CategoriaIcone = keyof typeof ICONES_CATEGORIA;
