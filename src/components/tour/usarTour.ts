"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { registrarEvento } from "@/lib/domain/auditoria";
import { novoId, agoraISO } from "@/lib/id";
import { useDadosStore, useSessaoStore } from "@/lib/store";
import { PASSOS, useTourStore } from "@/lib/store/tour";

/**
 * Inicia o Modo Apresentação. SEMPRE reseta a demonstração primeiro (começa
 * limpa, sem caixa aberto nem pedido de teste deixados para trás) e prepara os
 * dados que o tour precisa — um desconto recém-autorizado para o fluxo ii.
 *
 * `comLogin`: entra como Sarah (Dona) antes de começar. Usado no login, onde
 * ainda não há sessão. No menu do app já há sessão, então é dispensável.
 */
export function useIniciarTour() {
  const router = useRouter();
  const entrar = useSessaoStore((s) => s.entrar);
  const resetarDemo = useDadosStore((s) => s.resetarDemo);
  const adicionarEvento = useDadosStore((s) => s.adicionarEvento);
  const iniciar = useTourStore((s) => s.iniciar);

  return useCallback(
    (opts?: { comLogin?: boolean }) => {
      if (opts?.comLogin) entrar("u-sarah", "todas");

      // Estado limpo e determinístico.
      resetarDemo();

      // Dado preparado p/ o fluxo ii: um desconto recém-liberado pela gerente,
      // para a Auditoria ter uma linha fresca no topo ao chegar lá.
      adicionarEvento(
        registrarEvento(
          {
            tipo: "desconto",
            lojaId: "loja-1",
            usuarioId: "u-larissa",
            autorizadoPor: "u-marta",
            descricao:
              "Desconto de R$ 3,00 em PF de carne autorizado por Marta: cliente fiel",
            valorImpacto: -3,
          },
          novoId("ev"),
          agoraISO(),
        ),
      );

      iniciar();
      router.replace(PASSOS[0].rota);
    },
    [entrar, resetarDemo, adicionarEvento, iniciar, router],
  );
}
