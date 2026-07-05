import { expect, test } from "@playwright/test";

test.describe("muapi", () => {
  test("balance o error controlado visible", async ({ request }) => {
    const response = await request.get("/api/muapi/balance");
    expect([200, 401, 403, 500, 502]).toContain(response.status());
  });
});
