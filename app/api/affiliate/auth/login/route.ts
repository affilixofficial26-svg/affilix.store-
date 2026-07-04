import { NextRequest, NextResponse } from "next/server";
import { affiliateCookieName, affiliateCookieOptions, createAffiliateSession, verifyAffiliatePassword, type AffiliatePartner } from "@/lib/affiliate-auth";
import { notifyAdmin, notifyAffiliate } from "@/lib/notifications";
import { clearLoginFailures, emailSchema, getLoginLock, getRequestIp, passwordSchema, recordLoginFailure, sendTelegramAlert } from "@/lib/security";
import { getAdminDb } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const failUrl = (code: string) => {
    const url = new URL("/affiliate/login", req.url);
    url.searchParams.set("error", code);
    return url;
  };
  const parsed = emailSchema.safeParse(form.get("email"));
  const parsedPassword = passwordSchema.safeParse(form.get("password"));
  if (!parsed.success || !parsedPassword.success) return NextResponse.redirect(failUrl("invalid"), 303);
  const email = parsed.data;
  const password = parsedPassword.data;
  const lockKey = `affiliate:${email}:${getRequestIp(req)}`;
  const lockedUntil = getLoginLock(lockKey);

  if (lockedUntil) {
    return NextResponse.redirect(failUrl("locked"), 303);
  }

  const partner = (await getAdminDb().select<AffiliatePartner>("affiliate_partners", {
    select: "*",
    email: `eq.${email}`,
    status: "eq.active",
    limit: "1",
  }))[0];

  if (!partner || !verifyAffiliatePassword(password, partner.password_hash)) {
    const failure = recordLoginFailure(lockKey);
    if (failure.lockedUntil) await sendTelegramAlert(`AFFILIX alerta: bloqueo de login afiliado para ${email} desde ${getRequestIp(req)}.`);
    return NextResponse.redirect(failUrl("wrong"), 303);
  }

  clearLoginFailures(lockKey);
  await Promise.all([
    notifyAdmin({
      type: "affiliate_login",
      title: "Afiliado accedio a su cuenta",
      message: `${partner.full_name} entro al panel afiliado.`,
      actorType: "affiliate",
      actorId: partner.id,
      actorName: partner.full_name,
      data: { email: partner.email, ip: getRequestIp(req), brandName: partner.brand_name },
    }),
    notifyAffiliate({
      partnerId: partner.id,
      type: "login",
      title: "Acceso a tu cuenta",
      message: "Se inicio sesion en tu panel afiliado.",
      data: { ip: getRequestIp(req) },
    }),
  ]);
  const res = NextResponse.redirect(new URL("/affiliate/panel", req.url), 303);
  res.cookies.set(affiliateCookieName, createAffiliateSession(partner), affiliateCookieOptions());
  return res;
}
