import { test, expect, type Page } from "@playwright/test";

async function entrar(page: Page, nome: string, pin: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(nome) }).click();
  for (const d of pin.split(""))
    await page.getByRole("button", { name: d, exact: true }).click();
}

async function abrirCaixaEAdicionar(page: Page) {
  await entrar(page, "Larissa", "3333");
  await expect(page).toHaveURL(/\/pdv/);
  // Abertura de caixa obrigatória.
  await expect(page.getByRole("heading", { name: /Abrir o caixa/ })).toBeVisible();
  await page.getByRole("button", { name: "Abrir caixa" }).click();
  // Adiciona um produto à comanda.
  await page.getByRole("button", { name: /PF de carne/ }).first().click();
}

test("fluxo completo: abrir caixa → pedido → enviar → pagar", async ({ page }) => {
  await abrirCaixaEAdicionar(page);

  await page.getByRole("button", { name: /Enviar para cozinha/ }).click();

  // Momento da impressão: a comanda aparece com os botões.
  await expect(page.getByRole("button", { name: /Receber pagamento/ })).toBeVisible();
  await page.getByRole("button", { name: /Receber pagamento/ }).click();

  // Pagamento no Pix (padrão).
  await page.getByRole("button", { name: /Confirmar recebimento/ }).click();

  await expect(page.getByText(/recebida/)).toBeVisible();
});

test("fluxo negativo: desconto exige PIN de gerente/dona", async ({ page }) => {
  await abrirCaixaEAdicionar(page);

  await page.getByRole("button", { name: "Desconto" }).click();
  await page.getByRole("button", { name: /R\$\s*5,00/ }).click();

  // PIN de atendente é recusado ("desconto sem PIN").
  for (const d of "3333".split(""))
    await page.getByRole("button", { name: d, exact: true }).click();
  await expect(page.getByText(/sem permissão/)).toBeVisible();

  // Após o erro, o PIN limpa; então o PIN da gerente autoriza.
  await page.waitForTimeout(750);
  for (const d of "2222".split(""))
    await page.getByRole("button", { name: d, exact: true }).click();
  await expect(page.getByText(/Autorizado por Marta/)).toBeVisible();
});

test("impressão: a comanda térmica fica visível para imprimir (80mm)", async ({ page }) => {
  await abrirCaixaEAdicionar(page);
  await page.getByRole("button", { name: /Enviar para cozinha/ }).click();

  const ticket = page.locator(".ticket-print");
  await expect(ticket).toBeVisible();
  // Imagem do cupom (mídia normal → renderiza completo).
  await ticket.screenshot({ path: "docs/qa/fase-3/ticket-80mm.png" });

  // Em mídia de impressão, só a comanda fica visível na página.
  await page.emulateMedia({ media: "print" });
  await expect(ticket).toBeVisible();
});
