import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/productos-digitales",
  "/servicios-ia",
  "/kits-negocio",
  "/herramientas-ia",
  "/comparador",
  "/recursos",
  "/afiliados",
  "/planes",
  "/contacto",
  "/soporte",
  "/legal/terminos",
  "/s/logo-ia",
  "/kit/restaurantes",
  "/p/pack-prompts-marketing-100",
];

test.describe("web publica AFFILIX", () => {
  for (const route of publicRoutes) {
    test(`carga ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBeLessThan(400);
      await expect(page.locator("body")).toContainText(/AFFILIX|Affilix/i);
      await expect(page.locator("body")).not.toContainText(/Amazon/i);
      await expect(page.locator("body")).not.toContainText(/producto fisico|productos fisicos/i);
    });
  }

  test("home navega CTAs principales", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /productos digitales|explorar/i }).first().click();
    await expect(page).toHaveURL(/productos-digitales|productos|p\//);
    await page.goto("/");
    await page.getByRole("link", { name: /crear con ia|servicios/i }).first().click();
    await expect(page).toHaveURL(/servicios-ia|s\//);
    await page.goto("/");
    await page.getByRole("link", { name: /herramientas ia|herramientas/i }).first().click();
    await expect(page).toHaveURL(/herramientas-ia|tools/);
  });
});
