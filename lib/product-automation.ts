import { discoverProducts } from "@/lib/product-discovery";
import { getAdminDb } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import type { AffiliateProduct, ExternalProduct, Platform } from "@/types";

type ProductWithStats = AffiliateProduct & {
  total_clicks?: number | null;
  created_at?: string | null;
};

function hasSupplierImage(product: ExternalProduct) {
  try {
    return Boolean(product.image_url && /^https?:\/\//i.test(product.image_url) && new URL(product.image_url));
  } catch {
    return false;
  }
}

export function productProfitScore(product: Partial<Pick<AffiliateProduct, "commission_rate" | "commission_amount" | "rating" | "review_count" | "price" | "original_price">> & { total_clicks?: number | null }) {
  const commission = Number(product.commission_rate || 0) * 2.5;
  const commissionAmount = Math.min(Number(product.commission_amount || 0), 100) * 0.8;
  const rating = Number(product.rating || 0) * 8;
  const demand = Math.min(Math.log10(Number(product.review_count || 0) + 1) * 10, 40);
  const clicks = Math.min(Math.log10(Number(product.total_clicks || 0) + 1) * 8, 24);
  const discount = product.original_price && product.price && product.original_price > product.price ? ((product.original_price - product.price) / product.original_price) * 45 : 0;
  return Number((commission + commissionAmount + rating + demand + clicks + discount).toFixed(2));
}

export function isDiscounted(product: Pick<AffiliateProduct, "price" | "original_price">) {
  return Boolean(product.original_price && product.price && product.original_price > product.price);
}

export async function saveDiscoveredProducts(products: ExternalProduct[]) {
  const db = getAdminDb();
  const validProducts = products
    .filter((product) => product.title && product.affiliate_url && hasSupplierImage(product) && (product as { source_status?: string }).source_status !== "local")
    .sort((a, b) => productProfitScore(b) - productProfitScore(a))
    .slice(0, 40);
  const saved: AffiliateProduct[] = [];

  for (const product of validProducts) {
    const slug = slugify(`${product.title}-${product.platform}-${product.external_id}`);
    const rows = await db.upsert<AffiliateProduct>(
      "affiliate_products",
      {
        user_id: null,
        platform: product.platform,
        external_id: product.external_id,
        title: product.title,
        description: product.description || null,
        ai_title: product.title,
        ai_description: product.description || null,
        price: product.price || null,
        currency: product.currency || "USD",
        image_url: product.image_url || null,
        images: [product.image_url],
        image_source: "supplier",
        affiliate_url: product.affiliate_url,
        slug,
        rating: product.rating || null,
        review_count: product.review_count || null,
        category: product.category || null,
        commission_rate: product.commission_rate || null,
        is_active: true,
        is_featured: productProfitScore(product) >= 65,
        auto_published: true,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      "slug",
    );
    if (rows[0]) saved.push(rows[0]);
  }

  return saved;
}

export async function discoverAndPublishProfitableProducts(keywords = "hogar cocina mascotas fitness belleza electronica salud", platform: Platform | "all" = "all") {
  const result = await discoverProducts(keywords, platform);
  const saved = await saveDiscoveredProducts(result.products);
  await getAdminDb().insert("agent_logs", {
    user_id: null,
    action: "discover_profitable_products",
    status: result.errors.length ? "error" : "success",
    details: {
      keywords,
      found: result.products.length,
      saved: saved.length,
      errors: result.errors,
    },
  });
  return { ...result, saved };
}

export async function refreshOfferSelection(limit = 80) {
  const db = getAdminDb();
  const products = await db.select<ProductWithStats>("affiliate_products", {
    select: "*",
    is_active: "eq.true",
    order: "updated_at.desc",
    limit: String(limit),
  });
  const checkedAt = new Date().toISOString();
  const scored = products
    .map((product) => ({ product, score: productProfitScore(product), discounted: isDiscounted(product) }))
    .sort((a, b) => Number(b.discounted) - Number(a.discounted) || b.score - a.score);
  const featuredIds = new Set(scored.slice(0, 12).map((item) => item.product.id));

  for (const product of products) {
    await db.update("affiliate_products", { id: product.id }, {
      is_featured: featuredIds.has(product.id),
      last_price_check: checkedAt,
      updated_at: checkedAt,
    });
  }

  await db.insert("agent_logs", {
    user_id: null,
    action: "refresh_offer_selection",
    status: "success",
    details: {
      checked: products.length,
      featured: Array.from(featuredIds),
      discounted: scored.filter((item) => item.discounted).length,
      note: "La tienda destaca descuentos reales detectados por precio original mayor que precio actual. No se alteran precios externos del proveedor.",
    },
  });

  return { checked: products.length, featured: Array.from(featuredIds), discounted: scored.filter((item) => item.discounted).length };
}
