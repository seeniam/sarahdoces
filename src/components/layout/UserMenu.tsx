"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ChevronDown, LogOut, Moon, RotateCcw, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDadosStore, useSessaoStore } from "@/lib/store";
import type { Perfil, Usuario } from "@/types";

const ROTULO: Record<Perfil, string> = {
  dona: "Dona",
  gerente: "Gerente",
  atendente: "Atendente",
  cozinha: "Cozinha",
};

export function UserMenu({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const sair = useSessaoStore((s) => s.sair);
  const resetarDemo = useDadosStore((s) => s.resetarDemo);
  const escuro = resolvedTheme === "dark";

  function trocarUsuario() {
    sair();
    router.replace("/login");
  }

  function resetar() {
    resetarDemo();
    toast.success("Demonstração reiniciada", {
      description: "Os dados voltaram ao estado inicial de hoje.",
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 text-sm shadow-soft transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span className="grid size-8 place-items-center rounded-full bg-cereja font-display text-xs text-white">
          {usuario.avatar}
        </span>
        <span className="hidden font-medium text-foreground sm:inline">
          {usuario.nome}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-semibold">{usuario.nome}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {ROTULO[usuario.perfil]}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(escuro ? "light" : "dark")}>
          {escuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {escuro ? "Tema claro" : "Tema cacau"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={resetar}>
          <RotateCcw className="size-4" />
          Resetar demonstração
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={trocarUsuario}>
          <LogOut className="size-4" />
          Trocar usuário
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
