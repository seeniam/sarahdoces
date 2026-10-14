"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { Boxes, ClipboardCheck, ShoppingCart, ArrowLeftRight } from "lucide-react";
import { cn } from "cn";

// As rotas existem em app/(app)/estoque/*; o cast evita depender da geração de
// tipos do typedRoutes antes do build.
const ABAS: { href: string; label: string; icone: typeof Boxes }[] = [
  { href: "/estoque", label: "Posição", icone: Boxes },
  { href: "/estoque/compras", label: "Compras", icone: ShoppingCart },
  { href: "/estoque/contagem", label: "Contagem", icone: ClipboardCheck },
  { href: "/estoque/transferencias", label: "Transferências", icone: ArrowLeftRight },
];

/** Sub-navegação do módulo de estoque (abas por rota). */
export function EstoqueNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 text-sm">
      {ABAS.map(({ href, label, icone: Icone }) => {
        const ativo = pathname === href;
        return (
          <Link
            key={href}
            href={href as Route}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors",
              ativo
                ? "bg-cereja text-white"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icone className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
