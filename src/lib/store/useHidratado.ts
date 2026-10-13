"use client";

import { useEffect, useState } from "react";
import { cacheInvalido } from "@/lib/mock/seed";
import { useDadosStore } from "./dados";
import { useSessaoStore } from "./sessao";

// Re-hidrata os stores UMA vez, pós-montagem (os stores usam skipHydration).
// Assim o HTML do servidor e o primeiro render do cliente mostram o mesmo
// estado inicial, evitando mismatch. Se o dia (São Luís) ou a versão do seed
// mudou desde a última visita, regenera o banco para "hoje" (ver DECISOES D1.4:
// reset total — ações do dia anterior não são preservadas).
let promessa: Promise<unknown> | null = null;
function garantirRehidratacao(): Promise<unknown> {
  if (!promessa) {
    promessa = (async () => {
      await Promise.all([
        useDadosStore.persist.rehydrate(),
        useSessaoStore.persist.rehydrate(),
      ]);
      const { dataAncora, versaoSeed, resetarDemo } = useDadosStore.getState();
      if (cacheInvalido(dataAncora, versaoSeed, new Date())) {
        resetarDemo();
      }
    })();
  }
  return promessa;
}

/**
 * true depois que os dados persistidos foram lidos (e, se preciso, regenerados)
 * no cliente. Componentes que renderizam dados persistidos devem mostrar
 * skeleton enquanto for false.
 */
export function useHidratado(): boolean {
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => {
    let vivo = true;
    garantirRehidratacao().finally(() => {
      if (vivo) setHidratado(true);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return hidratado;
}
