"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Dispara cada variante de toast para conferência de contraste (QA Fase 9).
 * Título e descrição de cada variante vêm do mesmo primeiro plano, com AA
 * garantido sobre o fundo — ver globals.css ([data-sonner-toast][data-type]).
 */
export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Demonstração reiniciada", {
            description: "Os dados voltaram ao estado inicial de hoje.",
          })
        }
      >
        Sucesso
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("Não foi possível enviar", {
            description: "Abra o caixa antes de mandar a comanda para a cozinha.",
          })
        }
      >
        Erro
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning("Estoque de carne baixo", {
            description: "Restam 3,0 kg na Loja 1 — abaixo do mínimo de 8 kg.",
          })
        }
      >
        Atenção
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.info("Comanda reimpressa", {
            description: "A via da cozinha da mesa 4 saiu de novo.",
          })
        }
      >
        Info
      </Button>
    </div>
  );
}
