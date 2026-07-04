import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getAdminDb } from "@/lib/supabase";

const COOKIE_NAME = "affilix_affiliate";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type AffiliateSession = {
  id: string;
  email: string;
  store_slug: string;
  exp: number;
};

export type AffiliatePartner = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  brand_name: string;
  store_slug: string;
  website_url: string | null;
  payout_email: string | null;
  custom_domain?: string | null;
  domain_status?: "not_configured" | "pending_dns" | "connected";
  domain_notes?: string | null;
  promotion_goal_clicks?: number | string | null;
  promotion_goal_sales?: number | string | null;
  promotion_goal_revenue?: number | string | null;
  account_close_requested_at?: string | null;
  close_reason?: string | null;
  close_feedback?: string | null;
  affiliate_commission_rate: number | string;
  owner_commission_rate: number | string;
  status: "active" | "paused" | "blocked";
  created_at: string;
  updated_at: string;
};

function sessionSecret() {
  return process.env.AFFILIATE_SESSION_SECRET || process.env.ADMIN_PASSWORD || "affilix-local-session-secret";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function hashAffiliatePassword(password: string) {
  return bcrypt.hashSync(password, 12);
}

export function verifyAffiliatePassword(password: string, storedHash: string) {
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    return bcrypt.compareSync(password, storedHash);
  }
  const [algorithm, iterations, salt, hash] = storedHash.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterations || !salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, Number(iterations), 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}

export function createAffiliateSession(partner: Pick<AffiliatePartner, "id" | "email" | "store_slug">) {
  const payload: AffiliateSession = {
    id: partner.id,
    email: partner.email,
    store_slug: partner.store_slug,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function readAffiliateSessionFromValue(value?: string) {
  if (!value) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature || signature !== sign(encoded)) return null;
  try {
    const session = JSON.parse(decodeBase64Url(encoded)) as AffiliateSession;
    if (!session.id || !session.email || !session.store_slug || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getAffiliateSession() {
  const cookieStore = await cookies();
  return readAffiliateSessionFromValue(cookieStore.get(COOKIE_NAME)?.value);
}

export function affiliateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export { COOKIE_NAME as affiliateCookieName };

export async function getCurrentAffiliatePartner() {
  const session = await getAffiliateSession();
  if (!session) return null;
  const rows = await getAdminDb().select<AffiliatePartner>("affiliate_partners", {
    select: "*",
    id: `eq.${session.id}`,
    status: "eq.active",
    limit: "1",
  });
  return rows[0] || null;
}
