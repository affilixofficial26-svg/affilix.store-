import { expect, test } from "@playwright/test";

const affiliateRoutes = ["/affiliate/login", "/affiliate/panel", "/affiliate/dashboard"];

test.describe("panel afiliado", () => {
  for (const route of affiliateRoutes) {
    test(`ruta afiliado ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBeLessThan(500);
      await expect(page.locator("body")).not.toContainText(/Próximamente|Proximamente/);
    });
  }
});
