"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDadosStore, useSessaoStore, useHidratado } from "@/lib/store";
import { podeAcessarRota, rotaInicial } from "@/lib/auth/navegacao";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <div className="hidden w-64 shrink-0 bg-sidebar lg:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-16 border-b border-border" />
        <div className="flex-1 p-6">
          <div className="h-full animate-pulse rounded-[20px] bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const hidratado = useHidratado();
  const usuarioId = useSessaoStore((s) => s.usuarioId);
  const usuarios = useDadosStore((s) => s.usuarios);
  const pathname = usePathname();
  const router = useRouter();

  const usuario = useMemo(
    () => usuarios.find((u) => u.id === usuarioId) ?? null,
    [usuarios, usuarioId],
  );

  useEffect(() => {
    if (!hidratado) return;
    if (!usuario) {
      router.replace("/login");
      return;
    }
    if (!podeAcessarRota(usuario.perfil, pathname)) {
      router.replace(rotaInicial(usuario.perfil));
    }
  }, [hidratado, usuario, pathname, router]);

  // Enquanto hidrata ou redireciona, não pisca conteúdo errado.
  if (!hidratado || !usuario || !podeAcessarRota(usuario.perfil, pathname)) {
    return <ShellSkeleton />;
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar usuario={usuario} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar usuario={usuario} />
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-8">{children}</main>
        <BottomNav usuario={usuario} />
      </div>
    </div>
  );
}
