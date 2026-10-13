import { defineConfig, devices } from "@playwright/test";

/**
 * E2E contra o build de produção. Em CI, instalar o Chromium antes:
 * `pnpm exec playwright install --with-deps chromium`.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4319",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Porta 4319 (as 3000/3100 podem estar ocupadas). Reaproveita um `next start`
  // já rodando; senão sobe um (precisa de `pnpm build` antes).
  webServer: {
    command: "pnpm exec next start -p 4319",
    url: "http://localhost:4319",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
