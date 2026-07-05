import { expect, test } from "@playwright/test";

test.describe("centro de pruebas en vivo", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([{ name: "affilix_admin", value: "true", url: baseURL || "http://localhost:3004" }]);
  });

  test("panel visible y tabla de evidencia", async ({ page }) => {
    const response = await page.goto("/dashboard/live-tests", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: /Centro de pruebas en vivo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Ejecutar todas las pruebas/i })).toBeVisible();
    await expect(page.getByText(/Total pruebas/i)).toBeVisible();
  });
});
