import { NextRequest, NextResponse } from "next/server";
import { getCurrentAffiliatePartner } from "@/lib/affiliate-auth";
import { getAdminDb } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

function cleanUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.toString();
  } catch {
    return null;
  }
}

function cleanDomain(value: string) {
  const domain = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain) ? domain : null;
}

function cleanPositiveNumber(value: FormDataEntryValue | null) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

export async function POST(req: NextRequest) {
  const partner = await getCurrentAffiliatePartner();
  if (!partner) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const form = await req.formData();
  const brandName = String(form.get("brand_name") || "").trim();
  const fullName = String(form.get("full_name") || partner.full_name).trim();
  const email = String(form.get("email") || partner.email).trim().toLowerCase();
  const storeSlug = slugify(String(form.get("store_slug") || partner.store_slug));
  const websiteUrl = cleanUrl(String(form.get("website_url") || "").trim());
  const payoutEmail = String(form.get("payout_email") || "").trim().toLowerCase() || null;
  const customDomain = cleanDomain(String(form.get("custom_domain") || ""));
  const promotionGoalClicks = Math.round(cleanPositiveNumber(form.get("promotion_goal_clicks")));
  const promotionGoalSales = Math.round(cleanPositiveNumber(form.get("promotion_goal_sales")));
  const promotionGoalRevenue = cleanPositiveNumber(form.get("promotion_goal_revenue"));

  if (!brandName || !fullName || !storeSlug || !email.includes("@")) return NextResponse.json({ error: "Perfil, marca, email y slug son obligatorios" }, { status: 400 });

  await getAdminDb().update("affiliate_partners", { id: partner.id }, {
    full_name: fullName,
    email,
    brand_name: brandName,
    store_slug: storeSlug,
    website_url: websiteUrl,
    payout_email: payoutEmail,
    custom_domain: customDomain,
    domain_status: customDomain ? "pending_dns" : "not_configured",
    domain_notes: customDomain ? "Configura un CNAME hacia affilix.es y espera revision del administrador." : null,
    promotion_goal_clicks: promotionGoalClicks,
    promotion_goal_sales: promotionGoalSales,
    promotion_goal_revenue: promotionGoalRevenue,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.redirect(new URL("/affiliate/panel?settings=ok#ajustes", req.url), 303);
}
