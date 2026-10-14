/**
 * Capturas interativas da Fase 8 (comandas, encomendas, equipe, cardápio, config).
 * Requer o servidor em http://localhost:4319 e o Chromium instalado.
 *   pnpm tsx scripts/screenshots-fase8.ts
 */
import { chromium, type Page, type Browser } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = (process.env.BASE ?? "http://localhost:4319").replace(/\/$/, "");
const DESTINO = path.join("docs", "qa", "fase-8");

async function ctx(nav: Browser, w: number, h: number, usuarioId = "u-sarah", lojaAtiva = "todas") {
  const c = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await c.addInitScript(
    ({ usuarioId, lojaAtiva }) => {
      try {
        localStorage.setItem("cereja-tema", "light");
        localStorage.setItem("cereja-sessao", JSON.stringify({ state: { usuarioId, lojaAtiva }, version: 1 }));
      } catch {}
    },
    { usuarioId, lojaAtiva },
  );
  return c;
}
async function ir(p: Page, rota: string) {
  await p.goto(`${BASE}${rota}`, { waitUntil: "networkidle", timeout: 30_000 });
  await p.waitForTimeout(900);
}
async function salvar(p: Page, nome: string) {
  const arq = path.join(DESTINO, `${nome}.png`);
  await p.screenshot({ path: arq, fullPage: true });
  console.log(`✓ ${arq}`);
}

async function main() {
  await mkdir(DESTINO, { recursive: true });
  const nav = await chromium.launch();

  // /encomendas — kanban (1280) + calendário + nova
  {
    const c = await ctx(nav, 1280, 900);
    const p = await c.newPage();
    await ir(p, "/encomendas");
    await salvar(p, "encomendas-kanban__1280");
    await p.getByRole("button", { name: /Semana/ }).click();
    await p.waitForTimeout(600);
    await salvar(p, "encomendas-calendario__1280");
    await p.getByRole("button", { name: "Nova" }).click();
    await p.waitForTimeout(500);
    await salvar(p, "encomendas-nova__1280");
    await c.close();
  }

  // card de encomenda (390)
  {
    const c = await ctx(nav, 390, 844);
    const p = await c.newPage();
    await ir(p, "/encomendas");
    await salvar(p, "encomendas-kanban__390");
    await c.close();
  }

  // /cardapio — lista + modal de alterar preço
  {
    const c = await ctx(nav, 1280, 900, "u-marta", "loja-1");
    const p = await c.newPage();
    await ir(p, "/cardapio");
    await salvar(p, "cardapio__1280");
    await p.getByRole("button", { name: "Preço" }).first().click();
    await p.waitForTimeout(400);
    await p.getByLabel("Novo preço").fill("5");
    await p.waitForTimeout(300);
    await salvar(p, "cardapio-alterar-preco__1280");
    await c.close();
  }

  // /comandas — detalhe com linha do tempo
  {
    const c = await ctx(nav, 1280, 900);
    const p = await c.newPage();
    await ir(p, "/comandas");
    await salvar(p, "comandas__1280");
    // Abre a primeira comanda paga para a linha do tempo.
    await p.locator("button", { hasText: /#\d+/ }).first().click();
    await p.waitForTimeout(600);
    await salvar(p, "comandas-detalhe__1280");
    await c.close();
  }

  // /equipe — lista + página de pessoa (Thiago)
  {
    const c = await ctx(nav, 1280, 900);
    const p = await c.newPage();
    await ir(p, "/equipe");
    await salvar(p, "equipe__1280");
    await p.getByText("Thiago").first().click();
    await p.waitForTimeout(600);
    await salvar(p, "equipe-pessoa__1280");
    await c.close();
  }

  // /configuracoes
  {
    const c = await ctx(nav, 1280, 1000);
    const p = await c.newPage();
    await ir(p, "/configuracoes");
    await salvar(p, "configuracoes__1280");
    await c.close();
  }

  await nav.close();
  console.log(`\nConcluído em ${DESTINO}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
