import { ImageResponse } from "next/og";

// OG image com a marca (cerejas + nome + promessa). Porcelana, cereja e azulejo
// — as cores da casa. Fonte padrão do renderizador (sem dependência de rede).
export const alt = "Sarah Rangel — Café & Confeitaria Artesanal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const cereja = "#9E1B32";
  const azulejo = "#1E4F91";
  const pistache = "#5E7F36";
  const cacau = "#2B1B18";
  const porcelana = "#F5F6F8";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: porcelana,
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* Faixa de cor superior (azulejo) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 14,
            background: azulejo,
          }}
        />

        {/* Marca: cerejas + nome */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="96" height="96" viewBox="0 0 48 48" fill="none">
            <path d="M17 25 C18 18 24 13 30 9" stroke={cacau} strokeWidth="2.3" strokeLinecap="round" />
            <path d="M32 28 C34 20 31 13 30 9" stroke={cacau} strokeWidth="2.3" strokeLinecap="round" />
            <path d="M30 9 C34 3 41 4 43 9 C39 12 32 12 30 9 Z" fill={pistache} />
            <circle cx="17" cy="34" r="9" fill={cereja} />
            <circle cx="32" cy="36" r="8" fill={cereja} />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 54, fontWeight: 700, color: cacau, letterSpacing: -1 }}>
              Sarah Rangel
            </div>
            <div style={{ fontSize: 26, color: "#6b625f", marginTop: 4 }}>
              Café &amp; Confeitaria Artesanal
            </div>
          </div>
        </div>

        {/* Promessa */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: cacau,
              lineHeight: 1.05,
              maxWidth: 1000,
              letterSpacing: -1.5,
            }}
          >
            Cada pedido registrado, cada grama de carne contada.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
            <div style={{ width: 56, height: 8, borderRadius: 8, background: cereja }} />
            <div style={{ width: 28, height: 8, borderRadius: 8, background: azulejo }} />
            <div style={{ width: 28, height: 8, borderRadius: 8, background: pistache }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
