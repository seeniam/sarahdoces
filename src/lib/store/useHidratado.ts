"use client";

import { useEffect, useState } from "react";
import { useDadosStore } from "./dados";
import { useSessaoStore } from "./sessao";

// Re-hidrata os stores UMA vez, pós-montagem (os stores usam skipHydration).
// Assim o HTML do servidor e o primeiro render do cliente mostram o mesmo
// estado inicial (seed/defaults), evitando mismatch de hidratação.
let promessa: Promise<unknown> | null = null;
function garantirRehidratacao(): Promise<unknown> {
  if (!promessa) {
    promessa = Promise.all([
      useDadosStore.persist.rehydrate(),
      useSessaoStore.persist.rehydrate(),
    ]);
  }
  return promessa;
}

/**
 * true depois que os dados persistidos foram lidos no cliente. Componentes que
 * renderizam dados persistidos (comandas, sessão, etc.) devem mostrar skeleton
 * enquanto for false.
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
