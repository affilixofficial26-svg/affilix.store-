import { NextRequest, NextResponse } from "next/server";
import { getCurrentAffiliatePartner } from "@/lib/affiliate-auth";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct, PlatformAccount } from "@/types";

export async function POST(req: NextRequest) {
  const partner = await getCurrentAffiliatePartner();
  if (!partner) return NextResponse.redirect(new URL("/affiliate/login", req.url), 303);

  const form = await req.formData();
  const productId = String(form.get("source_product_id") || "").trim();
  const referer = req.headers.get("referer") || "/affiliate/dashboard";
  if (!productId) return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}promotion=invalid`, req.url), 303);

  const product = (await getAdminDb().select<AffiliateProduct>("affiliate_products", {
    select: "id,platform",
    id: `eq.${productId}`,
    is_active: "eq.true",
    image_url: "not.is.null",
    limit: "1",
  }))[0];

  if (!product) return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}promotion=missing`, req.url), 303);

  const connectedProvider = (await getAdminDb().select<PlatformAccount>("platform_accounts", {
    select: "id",
    user_id: "is.null",
    platform: `eq.${product.platform}`,
    connected: "eq.true",
    last_test_status: "eq.success",
    limit: "1",
  }))[0];

  if (!connectedProvider) return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}promotion=provider`, req.url), 303);

  const existing = (await getAdminDb().select<{ id: string }>("affiliate_partner_promotions", {
    select: "id",
    partner_id: `eq.${partner.id}`,
    source_product_id: `eq.${productId}`,
    limit: "1",
  }))[0];

  if (existing?.id) {
    await getAdminDb().update("affiliate_partner_promotions", { id: existing.id }, { updated_at: new Date().toISOString() });
  } else {
    await getAdminDb().insert("affiliate_partner_promotions", {
      partner_id: partner.id,
      source_product_id: productId,
      total_clicks: 0,
    });
  }

  return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}promotion=ready`, req.url), 303);
}
