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

test("Fase 8: atendente é barrado no cardápio; gerente altera preço (evento antigo→novo)", async ({
  page,
}) => {
  // Atendente não acessa o cardápio → é redirecionado para o PDV.
  await entrar(page, "Larissa", "3333");
  await expect(page).toHaveURL(/\/pdv/);
  await page.goto("/cardapio");
  await expect(page).toHaveURL(/\/pdv/, { timeout: 10_000 });

  // Gerente acessa e altera um preço (ação sensível, com PIN).
  await entrar(page, "Marta", "2222");
  await page.goto("/cardapio");
  await expect(page.getByRole("main").getByRole("heading", { name: "Cardápio" })).toBeVisible();
  await page.getByRole("button", { name: "Preço" }).first().click();

  await page.getByLabel("Novo preço").fill("99");
  await digitar(page, "2222");
  await page.getByRole("button", { name: "Autorizar" }).click();
  await expect(page.getByText(/Preço de .* atualizado/)).toBeVisible();

  // O evento com antigo → novo fica na auditoria (descrição única do evento).
  await page.goto("/auditoria?tipo=preco_alterado");
  await expect(page.getByText(/Preço de .*→/).first()).toBeVisible({ timeout: 10_000 });
  await page.getByText(/Preço de .*→/).first().click();
  await expect(page.getByText(/Antes → depois/)).toBeVisible();
});

test("Fase 8: encomenda pronta é entregue e vira receita no financeiro", async ({ page }) => {
  await entrar(page, "Sarah", "1234");
  await page.goto("/encomendas");
  await expect(page.getByRole("main").getByRole("heading", { name: "Encomendas" })).toBeVisible();

  // Saldo das entradas ANTES (fluxo de caixa).
  // Entrega a primeira encomenda pronta.
  const entregar = page.getByRole("button", { name: "Entregar" }).first();
  await expect(entregar).toBeVisible();
  await entregar.click();
  await page.getByRole("button", { name: /Confirmar entrega/ }).click();
  await expect(page.getByText(/entregue/).first()).toBeVisible();

  // O financeiro (fluxo de caixa) abre com receitas.
  await page.goto("/financeiro");
  await page.getByRole("button", { name: /Fluxo de caixa/ }).click();
  await expect(page.getByText(/Entradas/).first()).toBeVisible();
});
