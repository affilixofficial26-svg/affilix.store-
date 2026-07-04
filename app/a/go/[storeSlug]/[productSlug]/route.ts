import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { notifyAdminAndAffiliate } from "@/lib/notifications";
import { getAdminDb } from "@/lib/supabase";
import { detectDevice, getClientIp } from "@/lib/utils";
import type { AffiliatePartnerProduct, AffiliatePartnerPublic } from "@/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeSlug: string; productSlug: string }> }) {
  const { storeSlug, productSlug } = await params;
  const db = getAdminDb();
  const partner = (await db.select<AffiliatePartnerPublic>("affiliate_partners", {
    select: "id,email,full_name,brand_name,store_slug,website_url,payout_email,affiliate_commission_rate,owner_commission_rate,status,created_at",
    store_slug: `eq.${storeSlug}`,
    status: "eq.active",
    limit: "1",
  }))[0];

  if (!partner) return NextResponse.redirect(new URL(`/a/${storeSlug}`, req.url));

  const product = (await db.select<AffiliatePartnerProduct>("affiliate_partner_products", {
    select: "*",
    partner_id: `eq.${partner.id}`,
    slug: `eq.${productSlug}`,
    is_active: "eq.true",
    limit: "1",
  }))[0];

  if (!product) return NextResponse.redirect(new URL(`/a/${storeSlug}`, req.url));

  await db.insert("affiliate_partner_clicks", {
    partner_id: partner.id,
    product_id: product.id,
    session_id: req.cookies.get("affilix_session")?.value || crypto.randomUUID(),
    ip_address: getClientIp(req),
    user_agent: req.headers.get("user-agent") || "",
    referrer: req.headers.get("referer"),
    device_type: detectDevice(req.headers.get("user-agent") || ""),
  });
  await db.update("affiliate_partner_products", { id: product.id }, { total_clicks: Number(product.total_clicks || 0) + 1, updated_at: new Date().toISOString() });
  await notifyAdminAndAffiliate(
    {
      type: "affiliate_click",
      title: "Click en producto de afiliado",
      message: `${partner.full_name} recibio un click en ${product.title}.`,
      actorType: "affiliate",
      actorId: partner.id,
      actorName: partner.full_name,
      data: { productId: product.id, productTitle: product.title, storeSlug },
    },
    {
      partnerId: partner.id,
      type: "click",
      title: "Nuevo click",
      message: `Alguien hizo click en ${product.title}.`,
      data: { productId: product.id, productTitle: product.title },
    },
  );

  return NextResponse.redirect(product.affiliate_url, 302);
}
