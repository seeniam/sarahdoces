import "@testing-library/jest-dom/vitest";

// jsdom não tem BroadcastChannel; o app usa para sincronizar abas.
if (typeof globalThis.BroadcastChannel === "undefined") {
  class BC {
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    onmessage: ((e: MessageEvent) => void) | null = null;
  }
  // @ts-expect-error polyfill de teste
  globalThis.BroadcastChannel = BC;
}
