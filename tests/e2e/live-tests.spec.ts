import { expect, test } from "@playwright/test";
import { loginAdmin } from "./admin-auth";

test.describe("centro de pruebas en vivo", () => {
  test("panel visible y tabla de evidencia", async ({ page }) => {
    await loginAdmin(page, "/dashboard/live-tests");
    const response = await page.goto("/dashboard/live-tests", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: /Centro de pruebas en vivo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Ejecutar todas las pruebas/i })).toBeVisible();
    await expect(page.getByText(/Total pruebas/i)).toBeVisible();
  });
});
