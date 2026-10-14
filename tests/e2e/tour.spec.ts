import { test, expect, type Page } from "@playwright/test";

/**
 * Modo Apresentação (Fase 9): roda o tour inteiro pelos 4 fluxos do PRD §6 e
 * garante que não há erro de console em nenhum passo.
 */

// Escopo por CSS (não por role): quando um diálogo modal do app abre (ex.: o PIN
// do desconto), ele marca o balão do tour como aria-hidden — mas ele segue
// visível e clicável por ponteiro.
function balao(page: Page) {
  return page.locator("[data-tour-balloon]");
}

async function proximo(page: Page) {
  await page.locator("[data-tour-proximo]").click();
}

test("tour guiado: percorre os 4 fluxos sem erro de console", async ({ page }) => {
  const errosConsole: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errosConsole.push(msg.text());
  });
  page.on("pageerror", (err) => errosConsole.push(err.message));

  // Início pelo login (reseta a demo e entra como Sarah).
  await page.goto("/login");
  await page.getByRole("button", { name: /Ver demonstração guiada/ }).click();
  await expect(page).toHaveURL(/\/pdv/);

  // Fluxo i — pedido no caixa (comanda preparada + destaque no "Enviar").
  await expect(balao(page).getByText("Todo pedido vira comanda")).toBeVisible();
  await expect(page.getByText("PF de carne").first()).toBeVisible();
  await proximo(page);

  // Fluxo i — a comanda sai impressa (ticket térmico visível).
  await expect(balao(page).getByText("Saiu impressa na hora")).toBeVisible();
  await expect(page.locator(".ticket-print")).toBeVisible();
  await proximo(page);

  // Fluxo ii — desconto exige PIN do gerente (diálogo aberto).
  await expect(balao(page).getByText("Desconto só com o gerente")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Autorizar desconto/ })).toBeVisible();
  await proximo(page);

  // Fluxo ii — fica registrado na auditoria (linha recém-criada no topo).
  await expect(page).toHaveURL(/\/auditoria/);
  await expect(balao(page).getByText("E fica registrado")).toBeVisible();
  await expect(page.getByText(/autorizado por Marta/)).toBeVisible();
  await proximo(page);

  // Fluxo iii — a carne que some.
  await expect(page).toHaveURL(/\/perdas/);
  await expect(balao(page).getByText("Para onde foi a carne?")).toBeVisible();
  await expect(page.getByText(/não têm explicação/)).toBeVisible();
  await proximo(page);

  // Fluxo iv — caixa cego → alerta no painel.
  await expect(page).toHaveURL(/\/painel/);
  await expect(balao(page).getByText("A gaveta não bateu")).toBeVisible();
  await expect(page.getByText(/Caixa da Cohama fechou/)).toBeVisible();

  // Encerra ("Explorar por conta própria").
  await proximo(page);
  await expect(balao(page)).toHaveCount(0);

  expect(errosConsole, `erros de console: ${errosConsole.join(" | ")}`).toEqual([]);
});
