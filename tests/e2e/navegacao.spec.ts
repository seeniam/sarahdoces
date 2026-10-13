import { test, expect } from "@playwright/test";

async function entrar(
  page: import("@playwright/test").Page,
  nome: string,
  pin: string,
) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(nome) }).click();
  for (const d of pin.split("")) {
    await page.getByRole("button", { name: d, exact: true }).click();
  }
}

test("Dona entra, vai ao painel e vê Equipe (só dela)", async ({ page }) => {
  await entrar(page, "Sarah", "1234");
  await expect(page).toHaveURL(/\/painel/);
  await expect(page.getByRole("link", { name: "Equipe" })).toBeVisible();
});

test("Atendente vai ao PDV, sem Equipe, e é barrado no Painel", async ({ page }) => {
  await entrar(page, "Larissa", "3333");
  await expect(page).toHaveURL(/\/pdv/);
  await expect(page.getByRole("link", { name: "Equipe" })).toHaveCount(0);
  // Guarda de rota: atendente não acessa o painel.
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/pdv/);
});

test("Cozinha vai para a tela da cozinha", async ({ page }) => {
  await entrar(page, "Antônio", "4444");
  await expect(page).toHaveURL(/\/cozinha/);
});

test("PIN errado mostra erro e mantém no login", async ({ page }) => {
  await entrar(page, "Sarah", "0000");
  await expect(page.getByText(/PIN incorreto/)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("Rota do app sem sessão redireciona para o login", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/estoque");
  await expect(page).toHaveURL(/\/login/);
});
