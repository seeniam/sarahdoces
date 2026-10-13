/**
 * Captura de telas com Playwright para a Definition of Done visual.
 * Requer um servidor rodando (pnpm dev ou pnpm start) e o Chromium instalado
 * (pnpm exec playwright install chromium).
 *
 * Uso:
 *   pnpm screenshots --phase 0 --routes /,/design-system
 *   pnpm screenshots --phase 2 --base http://localhost:3000 --routes /login
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const argv = process.argv.slice(2);
function arg(nome: string, padrao: string): string {
  const i = argv.indexOf(`--${nome}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : padrao;
}

const fase = arg("phase", "0");
const base = arg("base", "http://localhost:3000").replace(/\/$/, "");
// "home" é um apelido para "/" — evita a conversão de caminho do MSYS/Git Bash,
// que transforma um "/" solto em caminho do Windows.
const rotas = arg("routes", "home,/design-system")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean)
  .map((r) => (r === "home" || r === "" ? "/" : r));

const viewports = [
  { nome: "390", largura: 390, altura: 844 },
  { nome: "1024", largura: 1024, altura: 768 },
  { nome: "1440", largura: 1440, altura: 900 },
];
const temas = ["claro", "escuro"] as const;

function slug(rota: string): string {
  if (rota === "/") return "home";
  return rota.replace(/^\//, "").replace(/\//g, "-") || "home";
}

async function main() {
  const destino = path.join("docs", "qa", `fase-${fase}`);
  await mkdir(destino, { recursive: true });

  const navegador = await chromium.launch();
  let total = 0;

  for (const rota of rotas) {
    for (const vp of viewports) {
      for (const tema of temas) {
        const contexto = await navegador.newContext({
          viewport: { width: vp.largura, height: vp.altura },
          deviceScaleFactor: 2,
        });
        await contexto.addInitScript((t) => {
          try {
            localStorage.setItem("cereja-tema", t === "escuro" ? "dark" : "light");
          } catch {}
        }, tema);

        const pagina = await contexto.newPage();
        const url = `${base}${rota}`;
        try {
          await pagina.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
          await pagina.waitForTimeout(500);
          const arquivo = path.join(
            destino,
            `${slug(rota)}__${vp.nome}__${tema}.png`,
          );
          await pagina.screenshot({ path: arquivo, fullPage: true });
          console.log(`✓ ${arquivo}`);
          total++;
        } catch (e) {
          console.error(`✗ ${url} (${vp.nome}/${tema}):`, (e as Error).message);
        }
        await contexto.close();
      }
    }
  }

  await navegador.close();
  console.log(`\n${total} telas salvas em ${destino}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
