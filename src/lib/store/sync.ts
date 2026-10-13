/**
 * Sincronização entre abas via BroadcastChannel. Em vez de trafegar o estado
 * inteiro, uma aba avisa "mudou" e as outras re-hidratam do localStorage
 * (fonte única). Guarda contra ping-pong com a flag `aplicando`.
 */
interface StoreComPersist {
  subscribe: (listener: () => void) => () => void;
  persist: { rehydrate: () => void | Promise<void> };
}

export function sincronizarAbas(canalNome: string, store: StoreComPersist): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return;
  }
  let canal: BroadcastChannel;
  try {
    canal = new BroadcastChannel(canalNome);
  } catch {
    return;
  }
  let aplicando = false;

  store.subscribe(() => {
    if (aplicando) return;
    try {
      canal.postMessage("sync");
    } catch {}
  });

  canal.onmessage = async () => {
    aplicando = true;
    try {
      await store.persist.rehydrate();
    } catch {}
    aplicando = false;
  };
}
