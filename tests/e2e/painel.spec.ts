import { test, expect, type Page } from "@playwright/test";

async function entrar(page: Page, nome: string, pin: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(nome) }).click();
  for (const d of pin.split(""))
    await page.getByRole("button", { name: d, exact: true }).click();
}

test("Fase 5: venda no PDV atualiza o painel em outra aba (ao vivo)", async ({
  page,
  context,
}) => {
  // Painel da Dona numa aba.
  await entrar(page, "Sarah", "1234");
  await expect(page).toHaveURL(/\/painel/);
  await expect(
    page.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ }),
  ).toBeVisible();
  await page.waitForTimeout(800); // baseline de pagamentos estabelecido

  // PDV noutra aba (mesmo contexto): recebe uma comanda aberta.
  const pdv = await context.newPage();
  await entrar(pdv, "Larissa", "3333");
  await expect(pdv).toHaveURL(/\/pdv/);
  await pdv.getByRole("button", { name: "Abrir caixa" }).click();
  await pdv.getByRole("button", { name: /Comandas abertas/ }).click();
  await pdv.getByRole("button", { name: "Receber", exact: true }).first().click();
  await pdv.getByText(/Total a receber/).waitFor();
  await pdv.getByRole("button", { name: /Confirmar recebimento/ }).click();

  // O painel recebe o aviso "Nova venda" sem recarregar (traz a aba à frente
  // para evitar o throttling de renderização de aba em segundo plano).
  await page.bringToFront();
  await page.waitForTimeout(1500);
  await expect(page.getByText(/Nova venda/)).toBeVisible({ timeout: 15_000 });
});
