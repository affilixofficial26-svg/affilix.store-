import { NextRequest, NextResponse } from "next/server";
import { getAdminCredentials, setAdminSessionCookie } from "@/lib/admin-auth";
import { clearLoginFailures, emailSchema, getLoginLock, getRequestIp, passwordSchema, recordLoginFailure, sendTelegramAlert } from "@/lib/security";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const redirectTo = String(form.get("redirect") || "/dashboard");
  const failUrl = (code: string) => {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", redirectTo.startsWith("/") ? redirectTo : "/dashboard");
    url.searchParams.set("error", code);
    return url;
  };
  const parsed = emailSchema.safeParse(form.get("email"));
  const parsedPassword = passwordSchema.safeParse(form.get("password"));
  if (!parsed.success || !parsedPassword.success) return NextResponse.redirect(failUrl("invalid"), 303);
  const email = parsed.data;
  const password = parsedPassword.data;
  const adminCredentials = getAdminCredentials();
  const lockKey = `admin:${email}:${getRequestIp(req)}`;
  const lockedUntil = getLoginLock(lockKey);

  if (lockedUntil) {
    return NextResponse.redirect(failUrl("locked"), 303);
  }

  if (adminCredentials.size === 0) {
    return NextResponse.redirect(failUrl("not_configured"), 303);
  }

  if (adminCredentials.get(email) !== password) {
    const failure = recordLoginFailure(lockKey);
    if (failure.lockedUntil) await sendTelegramAlert(`AFFILIX alerta: bloqueo de login administrador para ${email} desde ${getRequestIp(req)}.`);
    return NextResponse.redirect(failUrl("wrong"), 303);
  }

  clearLoginFailures(lockKey);
  const url = new URL(redirectTo.startsWith("/") ? redirectTo : "/dashboard", req.url);
  const res = NextResponse.redirect(url, 303);
  setAdminSessionCookie(res, email);
  return res;
}
