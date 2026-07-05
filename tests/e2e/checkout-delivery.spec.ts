import { expect, test } from "@playwright/test";

test.describe("checkout y entregas", () => {
  test("rutas de checkout y descarga responden sin romper", async ({ page }) => {
    for (const route of ["/checkout/cancel", "/checkout/success", "/download/test-token"]) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBeLessThan(500);
    }
  });
});
