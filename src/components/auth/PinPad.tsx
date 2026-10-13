"use client";

import { Delete } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "cn";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function PinPad({
  value,
  onChange,
  max = 4,
  erro = false,
}: {
  value: string;
  onChange: (v: string) => void;
  max?: number;
  erro?: boolean;
}) {
  const semMovimento = useReducedMotion();

  const digitar = (d: string) => {
    if (value.length < max) onChange(value + d);
  };
  const apagar = () => onChange(value.slice(0, -1));

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-7">
      {/* Indicador de dígitos */}
      <motion.div
        className="flex gap-3"
        animate={erro && !semMovimento ? { x: [0, -9, 9, -7, 7, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
      >
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-3.5 rounded-full border-2 transition-colors",
              erro
                ? "border-alerta bg-alerta"
                : i < value.length
                  ? "border-cereja bg-cereja"
                  : "border-border bg-transparent",
            )}
          />
        ))}
      </motion.div>

      {/* Teclado */}
      <div className="grid grid-cols-3 gap-3">
        {TECLAS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => digitar(t)}
            className="size-16 rounded-full border border-border bg-card font-display text-2xl text-foreground shadow-soft transition-transform active:scale-90 active:bg-acucar focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t}
          </button>
        ))}
        <span className="size-16" />
        <button
          type="button"
          onClick={() => digitar("0")}
          className="size-16 rounded-full border border-border bg-card font-display text-2xl text-foreground shadow-soft transition-transform active:scale-90 active:bg-acucar focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          0
        </button>
        <button
          type="button"
          onClick={apagar}
          aria-label="Apagar"
          className="grid size-16 place-items-center rounded-full text-muted-foreground transition-transform active:scale-90 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Delete className="size-6" />
        </button>
      </div>
    </div>
  );
}
