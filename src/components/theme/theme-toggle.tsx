"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Alterna claro/cacau. Sem estado nem efeito: os dois ícones são renderizados
 * e o CSS (variante `dark:`) escolhe qual mostrar — evita mismatch de
 * hidratação e o aviso react-hooks/set-state-in-effect.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label="Alternar tema"
      onClick={() => {
        const escuro = document.documentElement.classList.contains("dark");
        setTheme(escuro ? "light" : "dark");
      }}
    >
      <MoonIcon className="size-5 dark:hidden" />
      <SunIcon className="hidden size-5 dark:block" />
    </Button>
  );
}
