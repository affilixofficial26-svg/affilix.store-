import { NextRequest, NextResponse } from "next/server";
import { hashAffiliatePassword } from "@/lib/affiliate-auth";
import { notifyAdmin, notifyAffiliate } from "@/lib/notifications";
import { getAdminDb } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

function isAdmin(req: NextRequest) {
  return req.cookies.get("affilix_admin")?.value === "true";
}

function cleanUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.redirect(new URL("/login?redirect=/dashboard/affiliates&error=invalid", req.url), 303);

  const form = await req.formData();
  const action = String(form.get("action") || "create");

  if (action === "status") {
    const id = String(form.get("id") || "");
    const status = String(form.get("status") || "");
    if (!id || !["active", "paused", "blocked"].includes(status)) {
      return NextResponse.redirect(new URL("/dashboard/affiliates?affiliates=invalid-status", req.url), 303);
    }
    await getAdminDb().update("affiliate_partners", { id }, { status, updated_at: new Date().toISOString() });
    return NextResponse.redirect(new URL("/dashboard/affiliates?affiliates=status-ok", req.url), 303);
  }

  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const fullName = String(form.get("full_name") || "").trim();
  const brandName = String(form.get("brand_name") || "").trim();
  const storeSlug = slugify(String(form.get("store_slug") || brandName));
  const websiteUrl = cleanUrl(String(form.get("website_url") || "").trim());
  const payoutEmail = String(form.get("payout_email") || "").trim().toLowerCase() || null;
  const affiliateCommissionRate = Number(form.get("affiliate_commission_rate") || 80);
  const ownerCommissionRate = Number(form.get("owner_commission_rate") || 20);

  if (!email || !email.includes("@")) return NextResponse.redirect(new URL("/dashboard/affiliates?affiliates=invalid-email", req.url), 303);
  if (password.length < 8) return NextResponse.redirect(new URL("/dashboard/affiliates?affiliates=invalid-password", req.url), 303);
  if (!fullName || !brandName || !storeSlug) return NextResponse.redirect(new URL("/dashboard/affiliates?affiliates=missing-fields", req.url), 303);
  if (affiliateCommissionRate < 0 || ownerCommissionRate < 0 || affiliateCommissionRate + ownerCommissionRate > 100) {
    return NextResponse.redirect(new URL("/dashboard/affiliates?affiliates=invalid-rate", req.url), 303);
  }

  const rows = await getAdminDb().insert<{ id: string }>("affiliate_partners", {
    email,
    password_hash: hashAffiliatePassword(password),
    full_name: fullName,
    brand_name: brandName,
    store_slug: storeSlug,
    website_url: websiteUrl,
    payout_email: payoutEmail,
    affiliate_commission_rate: affiliateCommissionRate,
    owner_commission_rate: ownerCommissionRate,
    status: "active",
  });

  const partnerId = rows[0]?.id;
  await notifyAdmin({
    type: "affiliate_registered",
    title: "Nuevo afiliado creado",
    message: `${fullName} (${brandName}) ya tiene acceso afiliado.`,
    actorType: "affiliate",
    actorId: partnerId,
    actorName: fullName,
    data: { email, brandName, storeSlug },
  });
  if (partnerId) {
    await notifyAffiliate({
      partnerId,
      type: "account_created",
      title: "Cuenta afiliada creada",
      message: "Tu cuenta AFFILIX Partners esta lista para usar.",
      data: { brandName, storeSlug },
    });
  }

  return NextResponse.redirect(new URL("/dashboard/affiliates?affiliates=created", req.url), 303);
}
