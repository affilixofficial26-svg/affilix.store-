import { NextRequest, NextResponse } from "next/server";

type RateEntry = { count: number; resetAt: number };

const rateStore = new Map<string, RateEntry>();

export function getRequestIp(req: NextRequest) {
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0.0.0.0";
}

export function rateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const current = rateStore.get(key);
  if (!current || current.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  current.count += 1;
  return { allowed: current.count <= limit };
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

export function looksLikeBot(req: NextRequest) {
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
  return /sqlmap|nikto|acunetix|nessus|masscan|zgrab|python-requests|curl\/|wget\/|libwww-perl/i.test(userAgent);
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
