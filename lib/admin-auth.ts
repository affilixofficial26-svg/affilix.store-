import crypto from "node:crypto";
import { NextResponse } from "next/server";

const ADMIN_COOKIE = "affilix_admin";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

type AdminSession = {
  email: string;
  exp: number;
};

function adminSessionSecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.CSRF_SECRET ||
    process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET, CSRF_SECRET o ENCRYPTION_KEY debe tener al menos 32 caracteres.");
  }
  return secret;
}

function signAdminPayload(payload: string) {
  return crypto.createHmac("sha256", adminSessionSecret()).update(payload).digest("base64url");
}

export function createAdminSession(email: string) {
  const session: AdminSession = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${signAdminPayload(payload)}`;
}

export function verifyAdminSession(value?: string | null) {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = signAdminPayload(payload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (!session.email || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function getAdminCredentials() {
  const credentials = new Map<string, string>();
  const rawJson = process.env.ADMIN_USERS_JSON;

  if (rawJson) {
    const candidates = [
      rawJson,
      rawJson.replace(/\\"/g, '"'),
      rawJson.replace(/^"|"$/g, "").replace(/\\"/g, '"'),
    ];
    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as Record<string, unknown>;
        Object.entries(parsed).forEach(([email, password]) => {
          if (typeof password === "string" && password) credentials.set(email.trim().toLowerCase(), password);
        });
        break;
      } catch {
        // Compatible con variables pegadas con escape distinto en Vercel.
      }
    }
  }

  const inlineUsers = (process.env.ADMIN_USERS || "").split("|").map((item) => item.trim()).filter(Boolean);
  inlineUsers.forEach((item) => {
    const [email, ...passwordParts] = item.split(":");
    const password = passwordParts.join(":");
    if (email && password) credentials.set(email.trim().toLowerCase(), password);
  });

  const fallbackPassword = String(process.env.ADMIN_PASSWORD || "");
  if (fallbackPassword) {
    [
      process.env.ADMIN_EMAIL,
      ...(process.env.GOOGLE_ALLOWED_EMAILS || "").split(","),
    ]
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean)
      .forEach((adminEmail) => credentials.set(adminEmail, fallbackPassword));
  }

  return credentials;
}

export function verifyAdminCredentials(email: string, password: string) {
  const adminCredentials = getAdminCredentials();
  return {
    configured: adminCredentials.size > 0,
    valid: adminCredentials.get(email.trim().toLowerCase()) === password,
  };
}

export function setAdminSessionCookie(res: NextResponse, email: string) {
  res.cookies.set(ADMIN_COOKIE, createAdminSession(email), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}
