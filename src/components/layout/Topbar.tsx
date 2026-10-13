"use client";

import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { NAV } from "@/lib/auth/navegacao";
import { StoreSwitcher } from "./StoreSwitcher";
import { SinoAlertas } from "./SinoAlertas";
import { UserMenu } from "./UserMenu";
import type { Usuario } from "@/types";

export function Topbar({ usuario }: { usuario: Usuario }) {
  const pathname = usePathname();
  const item = NAV.find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );
  const titulo = item?.label ?? "";
  const mostrarSino = usuario.perfil === "dona" || usuario.perfil === "gerente";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Logo variante="marca" className="size-8 shrink-0 lg:hidden" />
        <h1 className="hidden truncate font-display text-xl text-foreground sm:block">
          {titulo}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <StoreSwitcher perfil={usuario.perfil} />
        {mostrarSino && <SinoAlertas />}
        <UserMenu usuario={usuario} />
      </div>
    </header>
  );
}
