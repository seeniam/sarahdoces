"use client";

import { Plus, Printer, Receipt } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TicketTermico } from "@/components/print/TicketTermico";
import type { Comanda } from "@/types";

/**
 * O momento da demo: a comanda "sai impressa" de cima para baixo (clip-path,
 * ~700ms). Depois o atendente imprime, recebe o pagamento ou abre uma nova.
 * Respeita prefers-reduced-motion.
 */
export function ImpressaoComanda({
  comanda,
  atendenteNome,
  onReceber,
  onNova,
}: {
  comanda: Comanda;
  atendenteNome: string;
  onReceber: () => void;
  onNova: () => void;
}) {
  const semMovimento = useReducedMotion();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-cacau/75 p-4 backdrop-blur-sm">
      <motion.div
        initial={
          semMovimento ? false : { clipPath: "inset(0 0 100% 0)", y: -10 }
        }
        animate={{ clipPath: "inset(0 0 0% 0)", y: 0 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="max-h-[68vh] overflow-y-auto"
      >
        <TicketTermico comanda={comanda} atendenteNome={atendenteNome} />
      </motion.div>

      <motion.div
        initial={semMovimento ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: semMovimento ? 0 : 0.6, duration: 0.25 }}
        className="flex flex-wrap justify-center gap-2 print:hidden"
      >
        <Button variant="outline" size="lg" className="h-12" onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimir
        </Button>
        <Button size="lg" className="h-12" onClick={onReceber}>
          <Receipt className="size-4" />
          Receber pagamento
        </Button>
        <Button variant="ghost" size="lg" className="h-12 text-white hover:bg-white/10" onClick={onNova}>
          <Plus className="size-4" />
          Nova comanda
        </Button>
      </motion.div>
    </div>
  );
}
