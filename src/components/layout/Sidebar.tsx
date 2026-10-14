"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "cn";
import { Azulejo } from "@/components/brand/Azulejo";
import { Logo, CerejaMark } from "@/components/brand/Logo";
import {
  itensDoPerfil,
  TITULOS_SECAO,
  type SecaoNav,
} from "@/lib/auth/navegacao";
import type { Usuario } from "@/types";

export function Sidebar({ usuario }: { usuario: Usuario }) {
  const pathname = usePathname();
  const [recolhida, setRecolhida] = useState(false);

  const itens = itensDoPerfil(usuario.perfil);
  const secoes = ["operacao", "gestao", "admin"] as const;

  const ativo = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex",
        "dark:border-r dark:border-white/[0.08]",
        recolhida ? "w-[76px]" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-4">
        {recolhida ? (
          <CerejaMark className="mx-auto size-8" />
        ) : (
          <Logo variante="compacta" textClassName="text-sidebar-foreground" />
        )}
      </div>

      {/* Navegação */}
      <nav className="relative z-10 flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {secoes.map((secao: SecaoNav) => {
          const daSecao = itens.filter((i) => i.secao === secao);
          if (daSecao.length === 0) return null;
          return (
            <div key={secao} className="space-y-1">
              {!recolhida && (
                <p className="px-3 pb-1 text-[11px] font-medium text-sidebar-foreground/65">
                  {TITULOS_SECAO[secao]}
                </p>
              )}
              {daSecao.map((item) => {
                const Icone = item.icone;
                const on = ativo(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={recolhida ? item.label : undefined}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors",
                      recolhida && "justify-center",
                      on
                        ? "bg-sidebar-primary/20 font-medium text-white"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
                    )}
                  >
                    <Icone strokeWidth={1.5} className="size-5 shrink-0" />
                    {!recolhida && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Azulejo discreto no rodapé */}
      <Azulejo
        tom="branco"
        opacity={0.06}
        tile={64}
        fade="top"
        className="absolute inset-x-0 bottom-0 z-0 h-40"
      />

      {/* Recolher */}
      <button
        type="button"
        onClick={() => setRecolhida((r) => !r)}
        aria-label={recolhida ? "Expandir menu" : "Recolher menu"}
        className="relative z-10 m-3 flex items-center justify-center gap-2 rounded-[10px] px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-white"
      >
        {recolhida ? (
          <PanelLeftOpen className="size-5" />
        ) : (
          <>
            <PanelLeftClose className="size-5" />
            <span>Recolher</span>
          </>
        )}
      </button>
    </aside>
  );
}
