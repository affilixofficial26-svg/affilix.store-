import { NextRequest, NextResponse } from "next/server";
import { affiliateCookieName, getCurrentAffiliatePartner } from "@/lib/affiliate-auth";
import { getAdminDb } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const partner = await getCurrentAffiliatePartner();
  if (!partner) return NextResponse.redirect(new URL("/affiliate/login", req.url), 303);

  const form = await req.formData();
  const confirmClose = String(form.get("confirm_close") || "") === "yes";
  const reason = String(form.get("close_reason") || "").trim();
  const feedback = String(form.get("close_feedback") || "").trim();

  if (!confirmClose || !reason) {
    return NextResponse.redirect(new URL("/affiliate/panel?close=missing#ajustes", req.url), 303);
  }

  const payload = {
    status: "paused",
    account_close_requested_at: new Date().toISOString(),
    close_reason: reason,
    close_feedback: feedback || null,
    updated_at: new Date().toISOString(),
  };

  try {
    await getAdminDb().update("affiliate_partners", { id: partner.id }, payload);
  } catch {
    await getAdminDb().update("affiliate_partners", { id: partner.id }, {
      status: "paused",
      account_close_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const res = NextResponse.redirect(new URL("/affiliate/login?closed=1", req.url), 303);
  res.cookies.delete(affiliateCookieName);
  return res;
}
