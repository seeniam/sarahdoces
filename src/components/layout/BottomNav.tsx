"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "cn";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BOTTOM_NAV,
  itensDoPerfil,
  TITULOS_SECAO,
  type SecaoNav,
} from "@/lib/auth/navegacao";
import type { Usuario } from "@/types";

export function BottomNav({ usuario }: { usuario: Usuario }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const itens = itensDoPerfil(usuario.perfil);
  const primarios = BOTTOM_NAV[usuario.perfil];
  const temMais = itens.length > primarios.length;
  const secoes = ["operacao", "gestao", "admin"] as const;

  const ativo = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur lg:hidden">
      {primarios.map((item) => {
        const Icone = item.icone;
        const on = ativo(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              on ? "text-cereja" : "text-muted-foreground",
            )}
          >
            <Icone strokeWidth={1.75} className="size-5" />
            <span className="max-w-full truncate px-0.5">{item.label}</span>
          </Link>
        );
      })}

      {temMais && (
        <Sheet open={aberto} onOpenChange={setAberto}>
          <SheetTrigger className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground">
            <MoreHorizontal className="size-5" />
            <span>Mais</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[20px]">
            <SheetHeader>
              <SheetTitle className="font-display text-xl">Menu</SheetTitle>
            </SheetHeader>
            <div className="space-y-5 overflow-y-auto px-4 pb-8">
              {secoes.map((secao: SecaoNav) => {
                const daSecao = itens.filter((i) => i.secao === secao);
                if (daSecao.length === 0) return null;
                return (
                  <div key={secao} className="space-y-1">
                    <p className="px-1 text-[11px] font-medium text-muted-foreground">
                      {TITULOS_SECAO[secao]}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {daSecao.map((item) => {
                        const Icone = item.icone;
                        const on = ativo(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setAberto(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-[12px] border border-border px-3 py-3 text-sm",
                              on
                                ? "bg-acucar/60 font-medium text-cereja"
                                : "bg-card text-foreground",
                            )}
                          >
                            <Icone strokeWidth={1.5} className="size-5 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </nav>
  );
}
