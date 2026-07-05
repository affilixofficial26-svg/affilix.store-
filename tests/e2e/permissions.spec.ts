import { expect, test } from "@playwright/test";

test.describe("permisos", () => {
  test("endpoint interno sin secreto no ejecuta acciones criticas", async ({ request }) => {
    const response = await request.post("/api/internal/finance/refresh-kpis");
    expect([401, 403]).toContain(response.status());
  });
});
