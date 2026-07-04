import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateMarketingContent } from "@/lib/marketing/ai-content";
import { getProviderAccountMap } from "@/lib/platform-accounts";
import { fetchProviderPageMetadata } from "@/lib/provider-metadata";
import { getAdminDb } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import type { AffiliateProduct } from "@/types";

const importLinkSchema = z.object({
  platform: z.enum(["amazon", "amazon_seller", "ebay", "rakuten", "clickbank", "hotmart", "gumroad", "payhip", "warriorplus", "systeme", "digistore", "jvzoo", "cj", "shareasale", "impact", "awin", "spocket", "cjdrop", "walmart", "temu", "shein", "flexoffers", "partnerstack", "fiverr", "semrush", "hubspot", "booking", "agoda", "coinbase", "binance", "aliexpress", "teachable", "shopify", "etsy"]),
  product_url: z.string().trim().url(),
  title: z.string().trim().max(300).optional(),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().trim().min(3).max(3).default("USD"),
  category: z.string().trim().max(120).default("Productos digitales"),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
});

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const parsed = importLinkSchema.safeParse(data);
  const referer = req.headers.get("referer") || "/dashboard/providers";

  if (!parsed.success) {
    if (contentType.includes("application/json")) return NextResponse.json({ error: "Datos de producto digital invalidos" }, { status: 400 });
    return NextResponse.redirect(new URL(`${referer}?import=error`, req.url), 303);
  }

  const input = parsed.data;
  const account = (await getProviderAccountMap()).get(input.platform);
  if (!account?.connected || account.last_test_status !== "success") {
    if (contentType.includes("application/json")) return NextResponse.json({ error: "Este proveedor no esta conectado. Prueba y activa la cuenta antes de importar productos." }, { status: 403 });
    return NextResponse.redirect(new URL(`${referer}?import=provider_not_connected`, req.url), 303);
  }

  let metadata = { title: "", description: "", imageUrl: "" };
  try {
    metadata = await fetchProviderPageMetadata(input.product_url);
  } catch {
    metadata = { title: "", description: "", imageUrl: "" };
  }

  const title = input.title || metadata.title || `Producto digital ${input.platform}`;
  const externalId = slugify(input.product_url).slice(0, 180) || `${input.platform}-${Date.now()}`;
  const slug = slugify(`${title}-${input.platform}-${externalId}`);
  const db = getAdminDb();
  const payload = {
    user_id: null,
    platform: input.platform,
    external_id: externalId,
    title,
    description: metadata.description || null,
    ai_title: title,
    ai_description: metadata.description || null,
    price: input.price || null,
    currency: input.currency,
    image_url: metadata.imageUrl || null,
    images: metadata.imageUrl ? [metadata.imageUrl] : [],
    image_source: metadata.imageUrl ? "supplier" : null,
    affiliate_url: input.product_url,
    slug,
    category: input.category || "Productos digitales",
    commission_rate: input.commission_rate || null,
    is_active: Boolean(metadata.imageUrl),
    auto_published: Boolean(metadata.imageUrl),
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
    } catch {
      // La publicacion del producto no depende de contenido IA.
    }
  }

  if (contentType.includes("application/json")) return NextResponse.json({ ok: true, product: savedProduct || null });
  return NextResponse.redirect(new URL("/dashboard/products?publish=ok", req.url), 303);
}
