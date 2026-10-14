/**
 * Capturas interativas da Fase 7 (fechamento cego, financeiro, auditoria).
 * Requer o servidor em http://localhost:4319 e o Chromium instalado.
 *   pnpm tsx scripts/screenshots-fase7.ts
 */
import { chromium, type Page, type Browser } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = (process.env.BASE ?? "http://localhost:4319").replace(/\/$/, "");
const DESTINO = path.join("docs", "qa", "fase-7");

async function contexto(
  nav: Browser,
  largura: number,
  altura: number,
  usuarioId: string,
  lojaAtiva = "todas",
) {
  const ctx = await nav.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript(
    ({ usuarioId, lojaAtiva }) => {
      try {
        localStorage.setItem("cereja-tema", "light");
        localStorage.setItem(
          "cereja-sessao",
          JSON.stringify({ state: { usuarioId, lojaAtiva }, version: 1 }),
        );
      } catch {}
    },
    { usuarioId, lojaAtiva },
  );
  return ctx;
}

async function ir(page: Page, rota: string) {
  await page.goto(`${BASE}${rota}`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(900);
}
async function salvar(page: Page, nome: string) {
  const arquivo = path.join(DESTINO, `${nome}.png`);
  await page.screenshot({ path: arquivo, fullPage: true });
  console.log(`✓ ${arquivo}`);
}

async function main() {
  await mkdir(DESTINO, { recursive: true });
  const nav = await chromium.launch();

  // --- Fechamento cego: informar + resultado (1024) ---
  {
    const ctx = await contexto(nav, 1024, 768, "u-larissa", "loja-1");
    const page = await ctx.newPage();
    await ir(page, "/pdv");
    await page.getByRole("button", { name: "Abrir caixa" }).click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Fechar caixa" }).click();
    await page.waitForTimeout(500);
    await page.getByLabel("Valor contado em Dinheiro").fill("120");
    await page.getByLabel("Valor contado em Cartão de débito").fill("0");
    await page.getByLabel("Valor contado em Cartão de crédito").fill("0");
    await salvar(page, "fechamento-cego-informar__1024");
    await page.getByRole("button", { name: /Confirmar fechamento/ }).click();
    await page.waitForTimeout(700);
    await salvar(page, "fechamento-cego-resultado__1024");
    await ctx.close();
  }

  // --- /financeiro: DRE cascata (1280) ---
  {
    const ctx = await contexto(nav, 1280, 900, "u-sarah");
    const page = await ctx.newPage();
    await ir(page, "/financeiro");
    await salvar(page, "financeiro-dre__1280");
    // Fluxo de caixa também, de brinde.
    await page.getByRole("button", { name: /Fluxo de caixa/ }).click();
    await page.waitForTimeout(700);
    await salvar(page, "financeiro-fluxo__1280");
    await ctx.close();
  }

  // --- Contas a pagar (390) ---
  {
    const ctx = await contexto(nav, 390, 844, "u-sarah");
    const page = await ctx.newPage();
    await ir(page, "/financeiro");
    await page.getByRole("button", { name: /Contas a pagar/ }).click();
    await page.waitForTimeout(600);
    await salvar(page, "financeiro-contas__390");
    await ctx.close();
  }

  // --- /auditoria timeline (1280) ---
  {
    const ctx = await contexto(nav, 1280, 900, "u-sarah");
    const page = await ctx.newPage();
    await ir(page, "/auditoria");
    await salvar(page, "auditoria-timeline__1280");
    await ctx.close();
  }

  // --- Pontos de atenção do Thiago (1280) ---
  {
    const ctx = await contexto(nav, 1280, 900, "u-sarah");
    const page = await ctx.newPage();
    await ir(page, "/auditoria?aba=atencao&pessoa=u-thiago");
    await salvar(page, "auditoria-pontos-thiago__1280");
    await ctx.close();
  }

  await nav.close();
  console.log(`\nConcluído em ${DESTINO}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
