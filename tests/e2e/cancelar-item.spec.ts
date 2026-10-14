import { test, expect, type Page } from "@playwright/test";

async function entrar(page: Page, nome: string, pin: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(nome) }).click();
  for (const d of pin.split(""))
    await page.getByRole("button", { name: d, exact: true }).click();
}

async function digitar(page: Page, pin: string) {
  for (const d of pin.split(""))
    await page.getByRole("button", { name: d, exact: true }).click();
}

async function enviarComanda(page: Page) {
  await entrar(page, "Larissa", "3333");
  await expect(page).toHaveURL(/\/pdv/);
  await page.getByRole("button", { name: "Abrir caixa" }).click();
  // Dois itens: cancelar um deixa a comanda aberta (com o item riscado); se
  // cancelasse o único item, a comanda inteira seria cancelada e sairia da lista.
  await page.getByRole("button", { name: /PF de carne/ }).first().click();
  await page.getByRole("button", { name: /Suco natural/ }).first().click();
  await page.getByPlaceholder("Nº da mesa").fill("4");
  await page.getByRole("button", { name: /Enviar para cozinha/ }).click();
  // Fecha o overlay de impressão da via cozinha.
  await page.getByRole("button", { name: /Nova comanda/ }).click();
}

test("cancelar item: atendente é barrado, gerente autoriza, item fica riscado", async ({
  page,
}) => {
  await enviarComanda(page);

  await page.getByRole("button", { name: /Comandas abertas/ }).click();
  // Botão discreto "Cancelar" por item (≠ "Cancelar comanda").
  await page.getByRole("button", { name: "Cancelar", exact: true }).first().click();

  // Escolhe o motivo.
  await page.getByRole("button", { name: "Cliente desistiu" }).click();

  // PIN de atendente é recusado.
  await digitar(page, "3333");
  await expect(page.getByText(/sem permissão/)).toBeVisible();

  // Gerente (Marta) autoriza.
  await page.waitForTimeout(750);
  await digitar(page, "2222");
  await expect(page.getByText(/Autorizado por Marta/)).toBeVisible();
  await page.getByRole("button", { name: "Autorizar" }).click();

  // Via de CANCELAMENTO para a cozinha.
  await expect(page.getByText("Cancelamento")).toBeVisible();
  await page.getByRole("button", { name: /Fechar/ }).click();

  // O item aparece riscado com autorizador e motivo.
  await page.getByRole("button", { name: /Comandas abertas/ }).click();
  await expect(
    page.getByText(/Cancelado · Marta · Cliente desistiu/),
  ).toBeVisible();
});
