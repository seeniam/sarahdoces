import { test, expect, type Page } from "@playwright/test";

async function entrar(page: Page, nome: string, pin: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(nome) }).click();
  for (const d of pin.split(""))
    await page.getByRole("button", { name: d, exact: true }).click();
}

async function loginAbrirCaixa(page: Page) {
  await entrar(page, "Larissa", "3333");
  await expect(page).toHaveURL(/\/pdv/);
  await expect(page.getByRole("heading", { name: /Abrir o caixa/ })).toBeVisible();
  await page.getByRole("button", { name: "Abrir caixa" }).click();
  await page.getByRole("button", { name: /PF de carne/ }).first().click();
}

async function montarComanda(page: Page) {
  await loginAbrirCaixa(page);
  // Identificação obrigatória (comanda viva no desktop).
  await page.getByPlaceholder("Nº da mesa").fill("4");
}

test("fluxo completo: abrir caixa → pedido → enviar → pagar", async ({ page }) => {
  await montarComanda(page);
  await page.getByRole("button", { name: /Enviar para cozinha/ }).click();

  await expect(page.getByRole("button", { name: /Receber pagamento/ })).toBeVisible();
  await page.getByRole("button", { name: /Receber pagamento/ }).click();
  await page.getByRole("button", { name: /Confirmar recebimento/ }).click();

  await expect(page.getByText(/recebida/)).toBeVisible();
});

test("envio exige identificação (Mesa sem número é bloqueado)", async ({ page }) => {
  await loginAbrirCaixa(page); // sem preencher a mesa
  await page.getByRole("button", { name: /Enviar para cozinha/ }).click();
  await expect(page.getByText(/Informe o número da mesa/)).toBeVisible();
});

test("fluxo negativo: desconto exige PIN de gerente/dona", async ({ page }) => {
  await loginAbrirCaixa(page);
  await page.getByRole("button", { name: "Desconto" }).click();
  await page.getByRole("button", { name: /R\$\s*5,00/ }).click();

  for (const d of "3333".split(""))
    await page.getByRole("button", { name: d, exact: true }).click();
  await expect(page.getByText(/sem permissão/)).toBeVisible();

  await page.waitForTimeout(750);
  for (const d of "2222".split(""))
    await page.getByRole("button", { name: d, exact: true }).click();
  await expect(page.getByText(/Autorizado por Marta/)).toBeVisible();
});

test("impressão: a comanda térmica fica visível (80mm)", async ({ page }) => {
  await montarComanda(page);
  await page.getByRole("button", { name: /Enviar para cozinha/ }).click();

  const ticket = page.locator(".ticket-print");
  await expect(ticket).toBeVisible();
  await ticket.screenshot({ path: "docs/qa/fase-3/ticket-80mm.png" });

  await page.emulateMedia({ media: "print" });
  await expect(ticket).toBeVisible();
});

test.describe("mobile 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("PDV sem rolagem horizontal", async ({ page }) => {
    await loginAbrirCaixa(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });
});
