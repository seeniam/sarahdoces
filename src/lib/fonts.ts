import { Gloock, Hanken_Grotesk } from "next/font/google";

/**
 * Gloock — display/títulos e números-herói. Fonte de peso único (400);
 * omitir `weight` quebra o build no Next 16.
 */
export const gloock = Gloock({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-gloock",
});

/**
 * Hanken Grotesk — interface (todo o resto). Fonte variável: sem `weight`.
 */
export const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});
