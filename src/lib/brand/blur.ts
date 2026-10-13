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

/** Blur escuro e quente, para fotos grandes sobre o cacau (ex.: herói do login). */
const svgEscuro = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5a3a30"/><stop offset="100%" stop-color="#241512"/></linearGradient></defs><rect width="40" height="30" fill="url(%23g)"/></svg>`;

export const BLUR_ESCURO = `data:image/svg+xml;charset=utf-8,${svgEscuro
  .replace(/"/g, "'")
  .replace(/</g, "%3C")
  .replace(/>/g, "%3E")
  .replace(/#/g, "%23")}`;
