import { NextRequest, NextResponse } from "next/server";
import { decryptSecret } from "@/lib/security";
import { getAdminDb } from "@/lib/supabase";
import { fetchWithTimeout } from "@/lib/utils";
import type { SocialConfig } from "@/lib/marketing/types";

export async function POST(req: NextRequest) {
  const isJson = req.headers.get("content-type")?.includes("application/json");
  const config = (await getAdminDb().select<SocialConfig>("social_accounts", { select: "*", user_id: "is.null", limit: "1" }))[0];
  if (!config) {
    if (!isJson) return NextResponse.redirect(new URL("/dashboard/marketing/social-accounts?test=error&message=No%20hay%20cuentas%20sociales%20guardadas", req.url), 303);
    return NextResponse.json({ ok: false, message: "No hay cuentas sociales guardadas" }, { status: 400 });
  }
  const checks: Record<string, string> = {};
  if (config.facebook_enabled && config.facebook_page_id && config.facebook_page_token) {
    const res = await fetchWithTimeout(`https://graph.facebook.com/v24.0/${config.facebook_page_id}?fields=id,name&access_token=${encodeURIComponent(decryptSecret(config.facebook_page_token))}`);
    checks.facebook = res.ok ? "OK" : `ERROR ${res.status}`;
  }
  if (config.instagram_enabled && config.instagram_business_id && config.instagram_token) {
    const res = await fetchWithTimeout(`https://graph.facebook.com/v24.0/${config.instagram_business_id}?fields=id,username&access_token=${encodeURIComponent(decryptSecret(config.instagram_token))}`);
    checks.instagram = res.ok ? "OK" : `ERROR ${res.status}`;
  }
  if (config.pinterest_enabled && config.pinterest_token) {
    const res = await fetchWithTimeout("https://api.pinterest.com/v5/user_account", { headers: { Authorization: `Bearer ${decryptSecret(config.pinterest_token)}` } });
    checks.pinterest = res.ok ? "OK" : `ERROR ${res.status}`;
  }
  const ok = Object.values(checks).some((value) => value === "OK");
  if (!isJson) {
    return NextResponse.redirect(new URL(`/dashboard/marketing/social-accounts?test=${ok ? "ok" : "error"}`, req.url), 303);
  }
  return NextResponse.json({ ok, checks });
}
