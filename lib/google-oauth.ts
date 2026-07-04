import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fetchWithTimeout, retry } from "@/lib/utils";

type GoogleClientFile = {
  web?: {
    client_id?: string;
    client_secret?: string;
  };
  installed?: {
    client_id?: string;
    client_secret?: string;
  };
};

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

const stateCookie = "affilix_google_oauth_state";
const redirectCookie = "affilix_google_oauth_redirect";

function readGoogleClientFile() {
  const configuredPath = process.env.GOOGLE_OAUTH_CLIENT_FILE;
  const candidates = configuredPath
    ? [configuredPath]
    : [
      path.join(process.cwd(), "client_secret_389435161128-999iqlt9c2d1jpr4qfuhsn0me73a8shh.apps.googleusercontent.com.json"),
      path.join(process.cwd(), "google-oauth-client.json"),
    ];

  for (const file of candidates) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as GoogleClientFile;
      const config = parsed.web || parsed.installed;
      if (config?.client_id && config.client_secret) return config;
    } catch {
      // Sigue buscando otro archivo valido.
    }
  }
  return null;
}

export function getGoogleOAuthConfig() {
  const fileConfig = readGoogleClientFile();
  const clientId = process.env.GOOGLE_CLIENT_ID || fileConfig?.client_id;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || fileConfig?.client_secret;
  if (!clientId || !clientSecret) throw new Error("Faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET");
  return { clientId, clientSecret };
}

export function getGoogleRedirectUri(origin: string) {
  return process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;
}

export function createGoogleState() {
  return crypto.randomBytes(24).toString("base64url");
}

export function getGoogleCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  };
}

export function buildGoogleAuthUrl(origin: string, redirectTo: string, state: string) {
  const { clientId } = getGoogleOAuthConfig();
  const redirectUri = getGoogleRedirectUri(origin);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return { url, redirectUri, redirectTo: redirectTo.startsWith("/") ? redirectTo : "/dashboard" };
}

export async function exchangeGoogleCode(origin: string, code: string) {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const redirectUri = getGoogleRedirectUri(origin);
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  const res = await retry(() => fetchWithTimeout("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  }, 30000), 3, 700);
  const token = await res.json() as GoogleTokenResponse;
  if (!res.ok || token.error || !token.access_token) throw new Error(token.error_description || token.error || `Google token error ${res.status}`);
  return token;
}

export async function getGoogleUserInfo(accessToken: string) {
  const res = await retry(() => fetchWithTimeout("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  }, 30000), 3, 700);
  const info = await res.json() as GoogleUserInfo;
  if (!res.ok || !info.email) throw new Error("No se pudo obtener el email de Google");
  return info;
}

export function isAllowedGoogleEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const allowed = new Set(
    [
      process.env.ADMIN_EMAIL,
      ...(process.env.GOOGLE_ALLOWED_EMAILS || "").split(","),
    ]
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean),
  );
  return allowed.has(normalized);
}

export { redirectCookie as googleRedirectCookie, stateCookie as googleStateCookie };
