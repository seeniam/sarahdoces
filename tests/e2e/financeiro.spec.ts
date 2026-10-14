import { test, expect, type Page } from "@playwright/test";

async function entrar(page: Page, nome: string, pin: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(nome) }).click();
  for (const d of pin.split(""))
    await page.getByRole("button", { name: d, exact: true }).click();
}

test("Fase 7: fechamento cego com diferença → alerta no painel → detalhe na auditoria", async ({
  page,
  context,
}) => {
  // 1) Atendente abre o caixa e fecha às cegas com diferença.
  await entrar(page, "Larissa", "3333");
  await expect(page).toHaveURL(/\/pdv/);
  await page.getByRole("button", { name: "Abrir caixa" }).click();

  await page.getByRole("button", { name: "Fechar caixa" }).click();
  // Conta MENOS do que o troco inicial → falta no dinheiro.
  await page.getByLabel("Valor contado em Dinheiro").fill("50");
  await page.getByRole("button", { name: /Confirmar fechamento/ }).click();

  // Resultado mostra a diferença.
  await expect(page.getByText(/Diferença total/)).toBeVisible();
  await expect(page.getByText(/−R\$\s?50,00/).first()).toBeVisible();
  await page.getByRole("button", { name: /Concluir/ }).click();

  // 2) A Dona vê o alerta no painel (dados sincronizam entre abas).
  const painel = await context.newPage();
  await entrar(painel, "Sarah", "1234");
  await expect(painel).toHaveURL(/\/painel/);
  await painel.bringToFront();
  await painel.waitForTimeout(800);
  const alerta = painel.getByText(/fechou com/).first();
  await expect(alerta).toBeVisible({ timeout: 15_000 });

  // 3) Clicar no alerta leva à auditoria filtrada por diferença de caixa.
  await alerta.click();
  await expect(painel).toHaveURL(/\/auditoria/);
  // O evento aparece na linha do tempo (texto único da descrição).
  await expect(
    painel.getByText(/Caixa fechou com diferença/).first(),
  ).toBeVisible({ timeout: 10_000 });

  // 4) Detalhe do evento: é somente leitura.
  await painel.getByText(/Caixa fechou com diferença/).first().click();
  await expect(painel.getByText(/não pode ser alterado/)).toBeVisible();
});
