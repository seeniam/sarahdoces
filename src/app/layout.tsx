import type { Metadata, Viewport } from "next";
import { gloock, hanken } from "@/lib/fonts";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sarahdoces-loja.vercel.app"),
  title: {
    default: "Sarah Rangel · Gestão",
    template: "%s · Sarah Rangel",
  },
  description:
    "Cada pedido registrado, cada grama de carne contada. Sistema de gestão para café & confeitaria.",
  applicationName: "Cereja",
  // Demonstração privada: fora dos buscadores (ver também app/robots.ts).
  robots: { index: false, follow: false },
  openGraph: {
    title: "Sarah Rangel — Café & Confeitaria Artesanal",
    description:
      "Cada pedido registrado, cada grama de carne contada.",
    url: "/",
    siteName: "Sarah Rangel",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F6F8" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1210" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${gloock.variable} ${hanken.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
