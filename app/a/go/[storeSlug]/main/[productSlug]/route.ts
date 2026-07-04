import { NextRequest, NextResponse } from "next/server";
import { notifyAdminAndAffiliate } from "@/lib/notifications";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliatePartnerPromotion, AffiliatePartnerPublic, AffiliateProduct } from "@/types";

function getRequestIp(req: NextRequest) {
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeSlug: string; productSlug: string }> }) {
  const { storeSlug, productSlug } = await params;
  const db = getAdminDb();
  const [partner, product] = await Promise.all([
    db.select<AffiliatePartnerPublic>("affiliate_partners", {
      select: "id,email,full_name,brand_name,store_slug,website_url,payout_email,affiliate_commission_rate,owner_commission_rate,status,created_at",
      store_slug: `eq.${storeSlug}`,
      status: "eq.active",
      limit: "1",
    }),
    db.select<AffiliateProduct>("affiliate_products", {
      select: "*",
      slug: `eq.${productSlug}`,
      is_active: "eq.true",
      limit: "1",
    }),
  ]);

  const affiliate = partner[0];
  const promotedProduct = product[0];
  if (!affiliate || !promotedProduct) return NextResponse.redirect(new URL("/productos", req.url));

  const promotion = (await db.select<AffiliatePartnerPromotion>("affiliate_partner_promotions", {
    select: "*",
    partner_id: `eq.${affiliate.id}`,
    source_product_id: `eq.${promotedProduct.id}`,
    limit: "1",
  }))[0];

  const savedPromotion = promotion || (await db.insert<AffiliatePartnerPromotion>("affiliate_partner_promotions", {
    partner_id: affiliate.id,
    source_product_id: promotedProduct.id,
    total_clicks: 0,
  }))[0];

  await Promise.all([
    db.insert("affiliate_partner_promotion_clicks", {
      partner_id: affiliate.id,
      promotion_id: savedPromotion?.id || null,
      source_product_id: promotedProduct.id,
      session_id: req.cookies.get("affilix_session")?.value || null,
      ip_address: getRequestIp(req),
      user_agent: req.headers.get("user-agent"),
      referrer: req.headers.get("referer"),
    }),
    savedPromotion?.id
      ? db.update("affiliate_partner_promotions", { id: savedPromotion.id }, { total_clicks: Number(savedPromotion.total_clicks || 0) + 1, updated_at: new Date().toISOString() })
      : Promise.resolve([]),
  ]);
  await notifyAdminAndAffiliate(
    {
      type: "affiliate_main_click",
      title: "Click afiliado en web principal",
      message: `${affiliate.full_name} recibio un click hacia ${promotedProduct.title} desde la web principal.`,
      actorType: "affiliate",
      actorId: affiliate.id,
      actorName: affiliate.full_name,
      data: { productId: promotedProduct.id, productTitle: promotedProduct.title, storeSlug },
    },
    {
      partnerId: affiliate.id,
      type: "click",
      title: "Click en web principal",
      message: `Tu enlace de ${promotedProduct.title} recibio un click.`,
      data: { productId: promotedProduct.id, productTitle: promotedProduct.title },
    },
  );

  return NextResponse.redirect(new URL(`/go/${promotedProduct.slug}`, req.url), 302);
}
