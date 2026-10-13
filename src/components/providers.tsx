"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="cereja-tema"
    >
      <TooltipProvider delay={200}>{children}</TooltipProvider>
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
