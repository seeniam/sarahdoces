import { test, expect, type Page } from "@playwright/test";

async function entrar(page: Page, nome: string, pin: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(nome) }).click();
  for (const d of pin.split(""))
    await page.getByRole("button", { name: d, exact: true }).click();
}

test("Fase 4: KDS recebe o pedido de outra aba e avança o status", async ({
  page,
  context,
}) => {
  // Abre o KDS PRIMEIRO, para provar que recebe sem recarregar.
  const kds = await context.newPage();
  await entrar(kds, "Seu Antônio", "4444");
  await expect(kds).toHaveURL(/\/cozinha/);
  await expect(kds.getByRole("heading", { name: "Novos" })).toBeVisible();

  // PDV (outra aba, mesmo contexto) envia uma comanda da Loja 1.
  await entrar(page, "Larissa", "3333");
  await expect(page).toHaveURL(/\/pdv/);
  await page.getByRole("button", { name: "Abrir caixa" }).click();
  await page.getByRole("button", { name: /PF de carne/ }).first().click();
  await page.getByPlaceholder("Nº da mesa").fill("88");
  await page.getByRole("button", { name: /Enviar para cozinha/ }).click();
  await page.getByRole("button", { name: /Nova comanda/ }).click();

  // O KDS recebe (via BroadcastChannel) sem recarregar.
  const cartao = kds.locator("article").filter({ hasText: "Mesa 88" });
  await expect(cartao).toBeVisible({ timeout: 15_000 });

  // Avança o status: Novos → Preparando → Prontos.
  await cartao.getByRole("button", { name: /Começar preparo/ }).click();
  await expect(cartao.getByRole("button", { name: /Marcar pronto/ })).toBeVisible();
  await cartao.getByRole("button", { name: /Marcar pronto/ }).click();
  // Em "Prontos": botão "Entregue" (que remove o cartão do KDS).
  await expect(cartao.getByRole("button", { name: /Entregue/ })).toBeVisible();
  await cartao.getByRole("button", { name: /Entregue/ }).click();
  await expect(cartao).toHaveCount(0);
});
