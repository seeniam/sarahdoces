"use client";

import { useEffect } from "react";
import { Plus, Printer, Receipt, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TicketTermico, type ViaComanda } from "@/components/print/TicketTermico";
import { usePreferenciasStore } from "@/lib/store";
import { tocarSomImpressora } from "@/lib/som";
import type { Comanda } from "@/types";

/**
 * O momento da demo: a comanda "sai impressa" de cima para baixo (clip-path,
 * ~700ms). No envio, o atendente imprime, recebe o pagamento ou abre uma nova;
 * no cancelamento, imprime a via da cozinha e fecha.
 * Respeita prefers-reduced-motion e toca o som se a preferência estiver ligada.
 */
export function ImpressaoComanda({
  comanda,
  atendenteNome,
  via = "cozinha",
  itemIndex,
  autorizadorNome,
  motivoCancelamento,
  onReceber,
  onNova,
}: {
  comanda: Comanda;
  atendenteNome: string;
  via?: ViaComanda;
  itemIndex?: number;
  autorizadorNome?: string;
  motivoCancelamento?: string;
  onReceber?: () => void;
  onNova: () => void;
}) {
  const semMovimento = useReducedMotion();
  const somLigado = usePreferenciasStore((s) => s.somImpressao);
  const cancel = via === "cancelamento";

  useEffect(() => {
    if (somLigado) tocarSomImpressora();
    // Toca uma vez ao montar o overlay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <TicketTermico
          comanda={comanda}
          atendenteNome={atendenteNome}
          via={via}
          itemIndex={itemIndex}
          autorizadorNome={autorizadorNome}
          motivoCancelamento={motivoCancelamento}
        />
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

        {cancel ? (
          <Button size="lg" className="h-12" onClick={onNova}>
            <X className="size-4" />
            Fechar
          </Button>
        ) : (
          <>
            {onReceber && (
              <Button size="lg" className="h-12" onClick={onReceber}>
                <Receipt className="size-4" />
                Receber pagamento
              </Button>
            )}
            <Button
              variant="ghost"
              size="lg"
              className="h-12 text-white hover:bg-white/10"
              onClick={onNova}
            >
              <Plus className="size-4" />
              Nova comanda
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
