/**
 * Teste visual do KDS (cozinha) nas larguras estreitas que mostravam a
 * sobreposição do cabeçalho: 768px (tablet em pé) e 390px (celular).
 * Requer o servidor em http://localhost:4319 e o Chromium instalado.
 *   pnpm tsx scripts/screenshots-kds.ts
 */
import { chromium, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = (process.env.BASE ?? "http://localhost:4319").replace(/\/$/, "");
const DESTINO = path.join("docs", "qa", "revisao-kds");

// Seu Antônio (cozinha, Loja 1) → vê o quadro da cozinha da Loja 1.
const COZINHA = "u-antonio";

async function capturar(w: number, h: number, nome: string) {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await ctx.addInitScript((usuarioId) => {
    try {
      localStorage.setItem("cereja-tema", "light");
      localStorage.setItem("cereja-kds-som", "1"); // sem a faixa de ativar som
      localStorage.setItem(
        "cereja-sessao",
        JSON.stringify({ state: { usuarioId, lojaAtiva: "loja-1" }, version: 1 }),
      );
    } catch {}
  }, COZINHA);
  const p: Page = await ctx.newPage();
  await p.goto(`${BASE}/cozinha`, { waitUntil: "networkidle", timeout: 30_000 });
  await p.waitForTimeout(1200);
  const arq = path.join(DESTINO, `${nome}.png`);
  await p.screenshot({ path: arq, fullPage: false }); // viewport (o board trava na tela)
  console.log(`✓ ${arq}`);
  await nav.close();
}

async function main() {
  await mkdir(DESTINO, { recursive: true });
  await capturar(768, 1024, "kds-768-retrato");
  await capturar(390, 844, "kds-390");
  console.log(`\nConcluído em ${DESTINO}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
