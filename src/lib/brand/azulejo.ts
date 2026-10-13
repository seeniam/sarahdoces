/**
 * Azulejo "Cereja" — módulo original de azulejo ludovicense.
 *
 * Desenho próprio (não é clip-art): sobre uma grade 80×80 há uma rosácea
 * central (anel + estrela de 8 pontas), rosáceas de vértice nos quatro cantos
 * e losangos nos meios das arestas, ligados por uma treliça fina. Como as
 * rosáceas de canto estão centradas exatamente nos vértices e os losangos nos
 * meios das arestas, o módulo se encaixa sem emenda e forma um NOVO motivo
 * (círculos completos nos vértices) ao se repetir.
 *
 * Tudo em `stroke` para imprimir bem e permitir variações de opacidade.
 */

const TILE = 80;

/** Formas internas do módulo (viewBox 0 0 80 80). A cor entra via ${color}. */
function tileShapes(color: string, strokeWidth: number): string {
  const s = `stroke="${color}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  return [
    // Rosácea central: anel + miolo + ponto
    `<circle cx="40" cy="40" r="24" ${s}/>`,
    `<circle cx="40" cy="40" r="6" ${s}/>`,
    `<circle cx="40" cy="40" r="1.8" fill="${color}" stroke="none"/>`,
    // Estrela de 8 pontas (dois quadrados sobrepostos)
    `<path d="M23 23 H57 V57 H23 Z" ${s}/>`,
    `<path d="M40 16 L64 40 L40 64 L16 40 Z" ${s}/>`,
    // Rosáceas de vértice (arco externo r16 + interno r9) nos 4 cantos
    `<path d="M16 0 A16 16 0 0 1 0 16" ${s}/>`,
    `<path d="M80 16 A16 16 0 0 1 64 0" ${s}/>`,
    `<path d="M64 80 A16 16 0 0 1 80 64" ${s}/>`,
    `<path d="M0 64 A16 16 0 0 1 16 80" ${s}/>`,
    `<path d="M9 0 A9 9 0 0 1 0 9" ${s}/>`,
    `<path d="M80 9 A9 9 0 0 1 71 0" ${s}/>`,
    `<path d="M71 80 A9 9 0 0 1 80 71" ${s}/>`,
    `<path d="M0 71 A9 9 0 0 1 9 80" ${s}/>`,
    // Losangos nos meios das arestas (completam com o vizinho)
    `<path d="M40 -7 L47 0 L40 7 L33 0 Z" ${s}/>`,
    `<path d="M-7 40 L0 33 L7 40 L0 47 Z" ${s}/>`,
    `<path d="M73 40 L80 33 L87 40 L80 47 Z" ${s}/>`,
    `<path d="M40 73 L47 80 L40 87 L33 80 Z" ${s}/>`,
    // Treliça: diagonais p/ cantos
    `<path d="M23 23 L11.3 11.3" ${s}/>`,
    `<path d="M57 23 L68.7 11.3" ${s}/>`,
    `<path d="M57 57 L68.7 68.7" ${s}/>`,
    `<path d="M23 57 L11.3 68.7" ${s}/>`,
    // Treliça: eixos p/ arestas
    `<path d="M40 16 L40 7" ${s}/>`,
    `<path d="M64 40 L73 40" ${s}/>`,
    `<path d="M40 64 L40 73" ${s}/>`,
    `<path d="M16 40 L7 40" ${s}/>`,
  ].join("");
}

export interface AzulejoOptions {
  /** Cor concreta (hex/rgb). data-URI não resolve var() do CSS. */
  color?: string;
  opacity?: number;
  strokeWidth?: number;
  /** Tamanho do ladrilho renderizado, em px. */
  size?: number;
}

/** SVG completo do módulo como string. */
export function azulejoSvg({
  color = "#1E4F91",
  opacity = 1,
  strokeWidth = 1.4,
}: AzulejoOptions = {}): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">` +
    `<g opacity="${opacity}">${tileShapes(color, strokeWidth)}</g>` +
    `</svg>`
  );
}

/** `url("data:image/svg+xml,...")` pronto para background-image. */
export function azulejoDataUri(options: AzulejoOptions = {}): string {
  const encoded = encodeURIComponent(azulejoSvg(options));
  return `url("data:image/svg+xml,${encoded}")`;
}

/** Estilo de background pronto (imagem + tamanho do ladrilho). */
export function azulejoBackground(
  options: AzulejoOptions = {},
): React.CSSProperties {
  const size = options.size ?? 72;
  return {
    backgroundImage: azulejoDataUri(options),
    backgroundSize: `${size}px ${size}px`,
    backgroundRepeat: "repeat",
  };
}
