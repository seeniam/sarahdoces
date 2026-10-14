/**
 * Sincronização entre abas. Uma aba muda o estado (persist grava no
 * localStorage); as outras relêem o localStorage e aplicam via setState — sem
 * depender de persist.rehydrate (que não reaplica de forma confiável com
 * skipHydration). BroadcastChannel + evento `storage` cobrem os ambientes.
 * A flag `aplicando` evita o ping-pong (não rebroadcast durante a aplicação).
 */
interface StoreComPersist {
  subscribe: (listener: () => void) => () => void;
  setState: (partial: Record<string, unknown>) => void;
}

export function sincronizarAbas(canalNome: string, store: StoreComPersist): void {
  if (typeof window === "undefined") return;

  let aplicando = false;
  // Último conteúdo já aplicado/visto: ignora o eco do nosso próprio write
  // (quando aplicamos, o persist regrava e dispara `storage` na outra aba).
  let ultimoRaw: string | null = null;
  function aplicarDoStorage() {
    try {
      const raw = window.localStorage.getItem(canalNome);
      if (!raw || raw === ultimoRaw) return;
      ultimoRaw = raw;
      const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
      if (parsed && parsed.state) {
        aplicando = true;
        store.setState(parsed.state);
        aplicando = false;
      }
    } catch {
      aplicando = false;
    }
  }

  // BroadcastChannel (quando disponível): aviso leve "mudou".
  let canal: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    try {
      canal = new BroadcastChannel(canalNome);
      canal.onmessage = () => aplicarDoStorage();
    } catch {
      canal = null;
    }
  }

  store.subscribe(() => {
    if (aplicando) return;
    try {
      canal?.postMessage("sync");
    } catch {}
  });

  // Evento `storage`: dispara nas OUTRAS abas quando o localStorage muda
  // (mais confiável entre abas que o BroadcastChannel em alguns ambientes).
  window.addEventListener("storage", (e) => {
    if (e.key === canalNome || e.key === null) aplicarDoStorage();
  });
}
