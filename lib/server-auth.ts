import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { isTrustedInternalRequest } from "@/lib/qstash/verify";

export function isAdminRequest(req: NextRequest) {
  return Boolean(verifyAdminSession(req.cookies.get("affilix_admin")?.value));
}

export function isCronRequest(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && secret.length >= 32 && req.headers.get("authorization") === `Bearer ${secret}`);
}

export function requireAdmin(req: NextRequest) {
  if (isAdminRequest(req)) return null;
  return NextResponse.json({ error: "No autorizado." }, { status: 401 });
}

export function requireCron(req: NextRequest) {
  if (isCronRequest(req)) return null;
  return NextResponse.json({ error: "No autorizado." }, { status: 401 });
}

export async function requireInternal(req: NextRequest) {
  if (await isTrustedInternalRequest(req)) return null;
  return NextResponse.json({ error: "No autorizado." }, { status: 401 });
}

export function requireAdminOrCron(req: NextRequest) {
  if (isAdminRequest(req) || isCronRequest(req)) return null;
  return NextResponse.json({ error: "No autorizado." }, { status: 401 });
}
