import { expect, test } from "@playwright/test";

test("renderiza o painel com dados de agendamento mockados", async ({ page }) => {
  const visualDelayMs = 3000;

  await page.route("**/admin/agendamentos**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: 1,
        agendamentos: [
          {
            id: "ag-001",
            telefone: "12999999999",
            nome: "Maria Silva",
            motivo: "Cobrança indevida",
            dataPreferida: "2026-04-30",
            slotInicio: "2026-04-30T09:00:00.000Z",
            status: "solicitado",
            criadoEm: "2026-04-27T10:00:00.000Z",
            atualizadoEm: "2026-04-27T10:00:00.000Z",
            participantes: [],
          },
        ],
        metricas: {
          total: 1,
          hoje: 1,
          ultimos7Dias: 1,
          viraDado: 0,
          viraProcesso: 0,
          gestaoPublica: 0,
          porStatus: {
            solicitado: 1,
            confirmado: 0,
            cancelado: 0,
            atendido: 0,
          },
        },
      }),
    });
  });

  await page.goto("/");
  await page.waitForTimeout(visualDelayMs);

  await expect(page.getByRole("heading", { name: "Painel interno de agendamentos" })).toBeVisible();
  await page.waitForTimeout(visualDelayMs);

  await expect(page.getByRole("tab", { name: "Agendamentos" })).toBeVisible();
  await page.waitForTimeout(visualDelayMs);

  await expect(page.getByText("Maria Silva")).toBeVisible();
  await page.waitForTimeout(visualDelayMs);

  await expect(page.getByText("Cobrança indevida")).toBeVisible();
  await page.waitForTimeout(6000);
});
