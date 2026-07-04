import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RateEntry = { count: number; resetAt: number };
type LoginEntry = { failures: number; lockedUntil: number };

const rateStore = new Map<string, RateEntry>();
const loginStore = new Map<string, LoginEntry>();

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(8).max(256);
export const safeTextSchema = z.string().trim().max(5000);

export function getRequestIp(req: NextRequest) {
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0.0.0.0";
}

export function rateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const current = rateStore.get(key);
  if (!current || current.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  current.count += 1;
  if (current.count > limit) return { allowed: false, remaining: 0, resetAt: current.resetAt };
  return { allowed: true, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}

export function getLoginLock(key: string) {
  const entry = loginStore.get(key);
  if (!entry || entry.lockedUntil <= Date.now()) return null;
  return entry.lockedUntil;
}

export function recordLoginFailure(key: string, maxFailures = 5, lockMs = 15 * 60_000) {
  const now = Date.now();
  const current = loginStore.get(key) || { failures: 0, lockedUntil: 0 };
  const failures = current.lockedUntil > now ? current.failures : current.failures + 1;
  const lockedUntil = failures >= maxFailures ? now + lockMs : 0;
  loginStore.set(key, { failures, lockedUntil });
  return { failures, lockedUntil };
}

export function clearLoginFailures(key: string) {
  loginStore.delete(key);
}

export function getAllowedOrigins(req?: NextRequest) {
  const configured = (process.env.APP_ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const defaults = ["https://affilix.es", "https://www.affilix.es"];
  if (appUrl) defaults.push(appUrl);
  if (req) defaults.push(req.nextUrl.origin);
  return new Set([...defaults, ...configured]);
}

export function isAllowedOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return getAllowedOrigins(req).has(origin);
}

export function applySecurityHeaders(res: NextResponse, req?: NextRequest) {
  const origin = req?.headers.get("origin");
  if (req && origin && getAllowedOrigins(req).has(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
  }
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Affilix-Signature,X-Webhook-Signature");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; connect-src 'self' https: http://localhost:* http://127.0.0.1:*; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return res;
}

export function looksLikeBot(req: NextRequest) {
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
  return /sqlmap|nikto|acunetix|nessus|masscan|zgrab|python-requests|curl\/|wget\/|libwww-perl|bot attack/i.test(userAgent);
}

function getEncryptionKey() {
  const raw = process.env.ENCRYPTION_KEY || "";
  if (!/^[a-f0-9]{64}$/i.test(raw)) throw new Error("ENCRYPTION_KEY debe ser hex de 32 bytes");
  return Buffer.from(raw, "hex");
}

export function encryptSecret(value: string | null | undefined) {
  if (!value) return "";
  if (value.startsWith("enc:v1:")) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptSecret(value: string | null | undefined) {
  if (!value) return "";
  if (!value.startsWith("enc:v1:")) return value;
  const [, , ivRaw, tagRaw, encryptedRaw] = value.split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64url")), decipher.final()]).toString("utf8");
}

export function verifyWebhookSignature(rawBody: string, signature: string | null, secret = process.env.WEBHOOK_SECRET || process.env.CRON_SECRET) {
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const cleanSignature = signature.replace(/^sha256=/, "");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(cleanSignature));
}

export async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message.slice(0, 3900) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
