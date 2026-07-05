import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createAdminSession } from "@/lib/admin-auth";

function readLocalEnv(key: string) {
  if (process.env[key]) return process.env[key];
  try {
    const env = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    const match = env.match(new RegExp(`^${key}=(.*)$`, "m"));
    return match?.[1]?.trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

export async function loginAdmin(page: Page, redirect = "/dashboard") {
  const email = readLocalEnv("ADMIN_EMAIL");
  const secret =
    readLocalEnv("ADMIN_SESSION_SECRET") ||
    readLocalEnv("CSRF_SECRET") ||
    readLocalEnv("ENCRYPTION_KEY");
  expect(email, "ADMIN_EMAIL debe existir para pruebas admin").toBeTruthy();
  expect(secret, "ADMIN_SESSION_SECRET, CSRF_SECRET o ENCRYPTION_KEY debe existir para pruebas admin").toBeTruthy();

  process.env.ADMIN_SESSION_SECRET = secret;
  await page.context().addCookies([{
    name: "affilix_admin",
    value: createAdminSession(email!),
    url: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_STORE_URL || "https://affilix.es",
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  }]);
  await page.goto(redirect, { waitUntil: "domcontentloaded" });
}
