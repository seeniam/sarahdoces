/**
 * Placeholder de blur fixo (açúcar → porcelana), em SVG. Usado pelo
 * <FotoProduto> enquanto a foto carrega — fotos vêm de caminhos públicos
 * (string), então não há blurDataURL gerado automaticamente pelo next/image.
 * URI-encoded (sem Buffer) para funcionar em qualquer runtime.
 */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><defs><radialGradient id="g" cx="40%" cy="35%" r="75%"><stop offset="0%" stop-color="#F6DDDF"/><stop offset="100%" stop-color="#ECE4E2"/></radialGradient></defs><rect width="40" height="30" fill="url(%23g)"/></svg>`;

export const BLUR_ACUCAR = `data:image/svg+xml;charset=utf-8,${svg
  .replace(/"/g, "'")
  .replace(/</g, "%3C")
  .replace(/>/g, "%3E")
  .replace(/#/g, "%23")}`;
