import { expect, test } from "@playwright/test";
import { loginAdmin } from "./admin-auth";

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
  for (const route of adminRoutes) {
    test(`ruta admin ${route}`, async ({ page }) => {
      await loginAdmin(page, route);
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBeLessThan(500);
      await expect(page.locator("body")).not.toContainText(/Próximamente|Proximamente/);
    });
  }

  test("live-tests registra ejecucion publica", async ({ page }) => {
    await loginAdmin(page, "/dashboard/live-tests");
    await page.goto("/dashboard/live-tests", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Ejecutar solo publicas/i }).click();
    await page.waitForURL(/dashboard\/live-tests/, { timeout: 30_000 });
    await expect(page.getByText(/Ultima ejecucion visible/i)).toBeVisible();
  });
});
