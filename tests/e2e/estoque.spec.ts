import { test, expect, type Page } from "@playwright/test";

async function entrar(page: Page, nome: string, pin: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(nome) }).click();
  for (const d of pin.split(""))
    await page.getByRole("button", { name: d, exact: true }).click();
}

test("Fase 6: compra → estoque → contagem cega → divergência → alerta no painel", async ({
  page,
}) => {
  // 1) Dona entra e vê o alerta da carne no painel (vem do seed).
  await entrar(page, "Sarah", "1234");
  await expect(page).toHaveURL(/\/painel/);
  await expect(page.getByText(/sem explicação/i).first()).toBeVisible({ timeout: 15_000 });

  // 2) Estoque: o extrato da carne mostra a falta sem explicação.
  await page.goto("/estoque");
  await expect(
    page.getByRole("main").getByRole("heading", { name: "Estoque" }),
  ).toBeVisible();
  await page.getByText("Carne bovina (coxão)").first().click();
  await expect(page.getByText(/Sem explicação/).first()).toBeVisible();
  // Fecha o extrato (Esc).
  await page.keyboard.press("Escape");

  // 3) Compra: lançar uma nota de carne entra no estoque e no financeiro.
  await page.goto("/estoque/compras");
  await page.getByRole("button", { name: /Nova compra/ }).click();
  // Seleciona o insumo da primeira linha.
  await page.getByRole("combobox").filter({ hasText: /Insumo/ }).first().click();
  await page.getByRole("option", { name: "Carne bovina (coxão)" }).click();
  await page.getByPlaceholder(/Qtd/).fill("10");
  await page.getByPlaceholder("Valor R$").fill("400");
  await page.getByRole("button", { name: /Lançar compra/ }).click();
  await expect(page.getByText(/Compra lançada/)).toBeVisible();

  // 4) Contagem cega: conta a carne bem abaixo do teórico.
  await page.goto("/estoque/contagem");
  await expect(page.getByText(/Contagem às cegas/)).toBeVisible();
  await page.getByLabel("Contagem de Carne bovina (coxão)").fill("1");
  await page.getByRole("button", { name: /Concluir e ver divergências/ }).click();

  // 5) Divergência revelada, com a carne "sem explicação".
  await expect(page.getByRole("heading", { name: /Resultado da contagem/ })).toBeVisible();
  await expect(page.getByText(/sem explicação/i).first()).toBeVisible();

  // 6) De volta ao painel: o alerta de divergência continua lá.
  await page.goto("/painel");
  await expect(page.getByText(/sem explicação/i).first()).toBeVisible({ timeout: 15_000 });
});
