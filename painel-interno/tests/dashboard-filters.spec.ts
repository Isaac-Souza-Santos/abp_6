import { test, expect } from '@playwright/test';

test.describe('Dashboard filters', () => {
  test('busca por nome filtra a lista', async ({ page }) => {
    await page.goto('/');

    // preencher campo de busca por nome (ajuste o seletor conforme o app)
    const nomeInput = page.locator('input[placeholder="Nome, telefone, protocolo…"]');
    await nomeInput.fill('Maria');
    await nomeInput.press('Enter');

    // esperar que a lista mostre resultado com 'Maria'
    await expect(page.locator('text=Maria')).toBeVisible();
  });
});
