/**
 * Gerador pseudoaleatório determinístico (mulberry32). Mesma semente →
 * mesma sequência, então a demo sempre mostra os mesmos números.
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  /** [0, 1) */
  float(): number;
  /** inteiro em [min, max] */
  int(min: number, max: number): number;
  /** float em [min, max) */
  range(min: number, max: number): number;
  /** true com probabilidade p */
  chance(p: number): boolean;
  /** item aleatório do array */
  pick<T>(itens: readonly T[]): T;
  /** item ponderado por pesos (mesma ordem de itens) */
  pickPonderado<T>(itens: readonly T[], pesos: readonly number[]): T;
}

export function criarRng(seed: number): Rng {
  const next = mulberry32(seed);
  const self: Rng = {
    float: next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    range: (min, max) => next() * (max - min) + min,
    chance: (p) => next() < p,
    pick: (itens) => itens[Math.floor(next() * itens.length)],
    pickPonderado: (itens, pesos) => {
      const total = pesos.reduce((s, p) => s + p, 0);
      let r = next() * total;
      for (let i = 0; i < itens.length; i++) {
        r -= pesos[i];
        if (r < 0) return itens[i];
      }
      return itens[itens.length - 1];
    },
  };
  return self;
}
