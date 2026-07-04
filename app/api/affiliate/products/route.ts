import { NextRequest, NextResponse } from "next/server";
import { getCurrentAffiliatePartner } from "@/lib/affiliate-auth";
import { fetchProviderPageMetadata } from "@/lib/provider-metadata";
import { getAdminDb } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import type { AffiliateProduct, PlatformAccount } from "@/types";

function cleanUrl(value: string) {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const partner = await getCurrentAffiliatePartner();
  if (!partner) return NextResponse.redirect(new URL("/affiliate/login?error=invalid", req.url), 303);

  const form = await req.formData();
  const sourceProductId = String(form.get("source_product_id") || "").trim();
  const db = getAdminDb();

  if (sourceProductId) {
    const sourceProduct = (await db.select<AffiliateProduct>("affiliate_products", {
      select: "*",
      id: `eq.${sourceProductId}`,
      is_active: "eq.true",
      image_url: "not.is.null",
      limit: "1",
    }))[0];

    if (!sourceProduct) return NextResponse.redirect(new URL("/affiliate/panel?product=missing", req.url), 303);

    const connectedProvider = (await db.select<PlatformAccount>("platform_accounts", {
      select: "id",
      user_id: "is.null",
      platform: `eq.${sourceProduct.platform}`,
      connected: "eq.true",
      last_test_status: "eq.success",
      limit: "1",
    }))[0];

    if (!connectedProvider) return NextResponse.redirect(new URL("/affiliate/panel?product=provider", req.url), 303);

    const existing = (await db.select<{ id: string }>("affiliate_partner_products", {
      select: "id",
      partner_id: `eq.${partner.id}`,
      source_product_id: `eq.${sourceProduct.id}`,
      limit: "1",
    }))[0];

    const payload = {
      partner_id: partner.id,
      source_product_id: sourceProduct.id,
      title: sourceProduct.ai_title || sourceProduct.title,
      description: sourceProduct.ai_description || sourceProduct.description,
      price: sourceProduct.price,
      currency: sourceProduct.currency || "USD",
      image_url: sourceProduct.image_url,
      affiliate_url: sourceProduct.affiliate_url,
      slug: sourceProduct.slug,
      category: sourceProduct.category,
      seo_title: sourceProduct.seo_title || sourceProduct.ai_title || sourceProduct.title,
      seo_description: sourceProduct.seo_description || sourceProduct.ai_description || sourceProduct.description,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await db.update("affiliate_partner_products", { id: existing.id }, payload);
    } else {
      await db.insert("affiliate_partner_products", payload);
    }

    return NextResponse.redirect(new URL("/affiliate/panel?product=published-own", req.url), 303);
  }

  let title = String(form.get("title") || "").trim();
  let description = String(form.get("description") || "").trim() || null;
  const price = form.get("price") ? Number(form.get("price")) : null;
  const currency = String(form.get("currency") || "USD").trim().toUpperCase().slice(0, 3);
  let imageUrl = cleanUrl(String(form.get("image_url") || "").trim());
  const affiliateUrl = cleanUrl(String(form.get("affiliate_url") || "").trim());
  const category = String(form.get("category") || "").trim() || null;

  if (!affiliateUrl) return NextResponse.redirect(new URL("/affiliate/panel?product=invalid-url", req.url), 303);
  if (price !== null && (!Number.isFinite(price) || price < 0)) return NextResponse.redirect(new URL("/affiliate/panel?product=invalid-price", req.url), 303);

  if (!imageUrl || !title || !description) {
    try {
      const metadata = await fetchProviderPageMetadata(affiliateUrl);
      title = title || metadata.title;
      description = description || metadata.description || null;
      imageUrl = imageUrl || cleanUrl(metadata.imageUrl);
    } catch {
      // Algunos proveedores bloquean scraping de metadatos; el producto puede publicarse con datos manuales.
    }
  }

  const slug = slugify(String(form.get("slug") || title));
  if (!title || !slug) return NextResponse.redirect(new URL("/affiliate/panel?product=missing-title", req.url), 303);

  await db.insert("affiliate_partner_products", {
    partner_id: partner.id,
    title,
    description,
    price,
    currency,
    image_url: imageUrl,
    affiliate_url: affiliateUrl,
    slug,
    category,
    seo_title: title,
    seo_description: description,
    is_active: true,
  });

  return NextResponse.redirect(new URL("/affiliate/panel?product=published", req.url), 303);
}
