import { NextRequest, NextResponse } from "next/server";
import { clearLoginFailures, getRequestIp, recordLoginFailure, sendTelegramAlert } from "@/lib/security";
import { exchangeGoogleCode, getGoogleUserInfo, googleRedirectCookie, googleStateCookie, isAllowedGoogleEmail } from "@/lib/google-oauth";
import { setAdminSessionCookie } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(googleStateCookie)?.value;
  const redirectTo = req.cookies.get(googleRedirectCookie)?.value || "/dashboard";

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=google_state", req.url), 303);
  }

  try {
    const token = await exchangeGoogleCode(req.nextUrl.origin, code);
    const user = await getGoogleUserInfo(token.access_token!);
    const email = String(user.email || "").toLowerCase();
    const lockKey = `google-admin:${email}:${getRequestIp(req)}`;

    if (!user.email_verified || !isAllowedGoogleEmail(email)) {
      const failure = recordLoginFailure(lockKey);
      if (failure.lockedUntil) await sendTelegramAlert(`AFFILIX alerta: bloqueo OAuth Google para ${email} desde ${getRequestIp(req)}.`);
      return NextResponse.redirect(new URL("/login?error=google_unauthorized", req.url), 303);
    }

    clearLoginFailures(lockKey);
    const res = NextResponse.redirect(new URL(redirectTo.startsWith("/") ? redirectTo : "/dashboard", req.url), 303);
    setAdminSessionCookie(res, email);
    res.cookies.delete(googleStateCookie);
    res.cookies.delete(googleRedirectCookie);
    return res;
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_oauth", req.url), 303);
  }
}
