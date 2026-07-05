import { fetchWithTimeout, retry } from "@/lib/utils";

export type PayPalEnvironment = "sandbox" | "live";

type PayPalAccessToken = {
  access_token: string;
  expires_in: number;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

export function getPayPalEnvironment(): PayPalEnvironment {
  return process.env.PAYPAL_ENV?.toLowerCase() === "live" ? "live" : "sandbox";
}

export function isPayPalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export function isPayPalLive() {
  return isPayPalConfigured() && getPayPalEnvironment() === "live";
}

export function getPayPalBaseUrl() {
  return getPayPalEnvironment() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export async function getPayPalAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PayPal no está configurado.");

  const response = await retry(() =>
    fetchWithTimeout(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    }, 15_000),
  );
  if (!response.ok) throw new Error(`PayPal OAuth rechazó la autenticación (${response.status}).`);
  const payload = (await response.json()) as PayPalAccessToken;
  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(60, payload.expires_in - 120) * 1000,
  };
  return cachedToken.value;
}

export async function paypalRequest<T>(path: string, init: RequestInit = {}) {
  const token = await getPayPalAccessToken();
  const response = await retry(() =>
    fetchWithTimeout(`${getPayPalBaseUrl()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": crypto.randomUUID(),
        ...init.headers,
      },
      cache: "no-store",
    }, 20_000),
  );
  const payload = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message || `PayPal devolvió HTTP ${response.status}.`);
  }
  return payload;
}

