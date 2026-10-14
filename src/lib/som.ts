/**
 * Som curto de "impressora térmica" sintetizado com Web Audio API — sem asset.
 * Um burst de ruído filtrado com leve modulação, imitando o avanço do papel.
 * Silencioso e seguro se o AudioContext não existir ou o autoplay for bloqueado.
 */
export function tocarSomImpressora(volume = 0.35): void {
  if (typeof window === "undefined") return;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return;

  try {
    const ctx = new Ctx();
    const dur = 0.5;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Ruído com envelope decrescente + modulação (~55 Hz) = "rrrr" da impressora.
    for (let i = 0; i < frames; i++) {
      const t = i / frames;
      const env = Math.pow(1 - t, 1.4);
      const modul = 0.55 + 0.45 * Math.sign(Math.sin(i * 0.11));
      data[i] = (Math.random() * 2 - 1) * env * modul;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filtro = ctx.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.frequency.value = 1400;
    filtro.Q.value = 0.8;

    const ganho = ctx.createGain();
    ganho.gain.value = volume;

    src.connect(filtro).connect(ganho).connect(ctx.destination);
    src.start();
    src.onended = () => ctx.close().catch(() => {});
  } catch {
    // Autoplay bloqueado ou API indisponível — segue em silêncio.
  }
}

/**
 * Sino suave de "pedido novo" no KDS — duas notas curtas (sine). Best-effort:
 * silencioso se o autoplay estiver bloqueado ou a API indisponível.
 */
export function tocarSinoNovoPedido(volume = 0.25): void {
  if (typeof window === "undefined") return;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return;

  try {
    const ctx = new Ctx();
    const notas = [880, 1174.66]; // Lá5 → Ré6
    notas.forEach((freq, i) => {
      const t0 = ctx.currentTime + i * 0.14;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.24);
    });
    window.setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    // segue em silêncio
  }
}
