/**
 * Capturas interativas da Fase 6 (estoque, compras, contagem, fichas, perdas).
 * Requer o servidor em http://localhost:4319 (pnpm build && next start -p 4319)
 * e o Chromium instalado.
 *
 *   pnpm tsx scripts/screenshots-fase6.ts
 */
import { chromium, type Page, type Browser } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = (process.env.BASE ?? "http://localhost:4319").replace(/\/$/, "");
const DESTINO = path.join("docs", "qa", "fase-6");

async function contexto(navegador: Browser, largura: number, altura = 900) {
  const ctx = await navegador.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("cereja-tema", "light");
      localStorage.setItem(
        "cereja-sessao",
        JSON.stringify({ state: { usuarioId: "u-sarah", lojaAtiva: "todas" }, version: 1 }),
      );
    } catch {}
  });
  return ctx;
}

async function irPara(page: Page, rota: string) {
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

  // --- /estoque 1280 + extrato da carne aberto ---
  {
    const ctx = await contexto(nav, 1280);
    const page = await ctx.newPage();
    await irPara(page, "/estoque");
    await salvar(page, "estoque__1280");
    await page.getByText("Carne bovina (coxão)").first().click();
    await page.waitForTimeout(700);
    await salvar(page, "estoque-extrato-carne__1280");
    await ctx.close();
  }

  // --- contagem cega 390 (antes e depois) ---
  {
    const ctx = await contexto(nav, 390, 844);
    const page = await ctx.newPage();
    await irPara(page, "/estoque/contagem");
    // Preenche alguns itens (antes de concluir).
    await page.getByLabel("Contagem de Carne bovina (coxão)").fill("7");
    await page.getByLabel("Contagem de Frango (peito/coxa)").fill("12");
    await page.getByLabel("Contagem de Ovo").fill("90");
    await page.waitForTimeout(400);
    await salvar(page, "contagem-cega-390-antes");
    await page.getByRole("button", { name: /Concluir e ver divergências/ }).click();
    await page.waitForTimeout(800);
    await salvar(page, "contagem-cega-390-depois");
    await ctx.close();
  }

  // --- /fichas-tecnicas 1280 (inclui a calculadora de rendimento no topo) ---
  {
    const ctx = await contexto(nav, 1280);
    const page = await ctx.newPage();
    await irPara(page, "/fichas-tecnicas");
    await salvar(page, "fichas-tecnicas__1280");
    // Detalhe de um PF (CMV/margem ao vivo).
    await page.getByText("PF de carne").first().click();
    await page.waitForTimeout(700);
    await salvar(page, "fichas-detalhe__1280");
    await ctx.close();
  }

  // --- "Para onde foi a carne?" 1280 e 390 ---
  for (const largura of [1280, 390]) {
    const ctx = await contexto(nav, largura, largura === 390 ? 844 : 900);
    const page = await ctx.newPage();
    await irPara(page, "/perdas");
    await salvar(page, `para-onde-foi-a-carne__${largura}`);
    await ctx.close();
  }

  // --- Nova compra preenchida ---
  {
    const ctx = await contexto(nav, 1280);
    const page = await ctx.newPage();
    await irPara(page, "/estoque/compras");
    await page.getByRole("button", { name: /Nova compra/ }).click();
    await page.waitForTimeout(400);
    await page.getByRole("combobox").filter({ hasText: /Insumo/ }).first().click();
    await page.getByRole("option", { name: "Carne bovina (coxão)" }).click();
    await page.getByPlaceholder(/Qtd/).fill("20");
    await page.getByPlaceholder("Valor R$").fill("760");
    await page.waitForTimeout(400);
    await salvar(page, "nova-compra-preenchida__1280");
    await ctx.close();
  }

  await nav.close();
  console.log(`\nConcluído em ${DESTINO}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
