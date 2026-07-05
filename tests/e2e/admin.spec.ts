import { expect, test } from "@playwright/test";

const adminRoutes = [
  "/dashboard",
  "/dashboard/catalog",
  "/dashboard/digital-products",
  "/dashboard/ai-services",
  "/dashboard/business-kits",
  "/dashboard/orders",
  "/dashboard/deliveries",
  "/dashboard/saas",
  "/dashboard/comparator",
  "/dashboard/niche-factory",
  "/dashboard/affiliates",
  "/dashboard/marketing",
  "/dashboard/media-studio",
  "/dashboard/settings",
  "/dashboard/logs",
  "/dashboard/live-tests",
];

test.describe("panel admin", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([{ name: "affilix_admin", value: "true", url: baseURL || "http://localhost:3004" }]);
  });

  for (const route of adminRoutes) {
    test(`ruta admin ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBeLessThan(500);
      await expect(page.locator("body")).not.toContainText(/Próximamente|Proximamente/);
    });
  }

  test("live-tests registra ejecucion publica", async ({ page }) => {
    await page.goto("/dashboard/live-tests", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Ejecutar solo publicas/i }).click();
    await page.waitForURL(/dashboard\/live-tests/, { timeout: 30_000 });
    await expect(page.getByText(/Ultima ejecucion visible/i)).toBeVisible();
  });
});
