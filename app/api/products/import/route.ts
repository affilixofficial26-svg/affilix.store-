import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateMarketingContent } from "@/lib/marketing/ai-content";
import { resolveProviderImageUrl } from "@/lib/provider-image";
import { getAdminDb } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import type { AffiliateProduct } from "@/types";

const importSchema = z.object({
  platform: z.enum(["amazon", "amazon_seller", "ebay", "rakuten", "clickbank", "hotmart", "gumroad", "payhip", "warriorplus", "systeme", "digistore", "jvzoo", "cj", "shareasale", "impact", "awin", "spocket", "cjdrop", "walmart", "temu", "shein", "flexoffers", "partnerstack", "fiverr", "semrush", "hubspot", "booking", "agoda", "coinbase", "binance", "aliexpress", "teachable", "shopify", "etsy"]),
  external_id: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(5000).optional(),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().trim().min(3).max(3).default("USD"),
  image_url: z.string().trim().url().optional().or(z.literal("")),
  affiliate_url: z.string().trim().url(),
  category: z.string().trim().max(120).optional(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
  source_status: z.enum(["api", "local"]).optional(),
});

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const parsed = importSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return NextResponse.redirect(new URL("/dashboard/products/discover?error=producto_invalido", req.url), 303);

  const product = parsed.data;
  if (product.source_status === "local") return NextResponse.redirect(new URL("/dashboard/products/discover?error=solo_api_real", req.url), 303);
  let supplierImageUrl = product.image_url || "";
  if (!supplierImageUrl) {
    try {
      supplierImageUrl = await resolveProviderImageUrl(product.affiliate_url);
    } catch {
      supplierImageUrl = "";
    }
  }
  const hasSupplierImage = Boolean(supplierImageUrl);
  const slug = slugify(`${product.title}-${product.platform}-${product.external_id}`);
  const db = getAdminDb();
  const payload = {
    user_id: null,
    platform: product.platform,
    external_id: product.external_id,
    title: product.title,
    description: product.description || null,
    ai_title: product.title,
    ai_description: product.description || null,
    price: product.price || null,
    currency: product.currency,
    image_url: supplierImageUrl || null,
    images: supplierImageUrl ? [supplierImageUrl] : [],
    image_source: hasSupplierImage ? "supplier" : null,
    affiliate_url: product.affiliate_url,
    slug,
    category: product.category || null,
    commission_rate: product.commission_rate || null,
    is_active: hasSupplierImage,
    auto_published: false,
    updated_at: new Date().toISOString(),
  };

  const existing = (await db.select<AffiliateProduct>("affiliate_products", { select: "id", slug: `eq.${slug}`, limit: "1" }))[0];
  const rows = existing
    ? await db.update<AffiliateProduct>("affiliate_products", { id: existing.id }, payload)
    : await db.insert<AffiliateProduct>("affiliate_products", payload);
  const savedProduct = rows[0];
  if (savedProduct) {
    try {
      await generateMarketingContent(savedProduct);
    } catch (error) {
      await db.insert("agent_logs", {
        user_id: null,
        action: "marketing_content_auto_generation_failed",
        details: { product_id: savedProduct.id, error: String(error instanceof Error ? error.message : error) },
        status: "error",
      });
    }
  }

  await db.insert("agent_logs", {
    user_id: null,
    action: "product_imported_from_discovery",
    details: { title: product.title, platform: product.platform, slug },
    status: "success",
  });

  return NextResponse.redirect(new URL("/dashboard/products", req.url), 303);
}
