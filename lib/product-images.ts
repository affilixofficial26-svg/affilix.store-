import { generateProductImage } from "@/lib/image-client";
import { getLocalAiConfig } from "@/lib/local-ai-config";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct, ImageProvider, UserProfile } from "@/types";

async function resolveProductImageConfig(product: AffiliateProduct) {
  if (product.user_id) {
    const profile = (await getAdminDb().select<UserProfile>("user_profiles", {
      select: "*",
      id: `eq.${product.user_id}`,
      limit: "1",
    }))[0];
    if (profile?.image_provider) {
      return {
        provider: profile.image_provider,
        apiKey: profile.image_api_key || profile.ai_api_key,
        model: profile.image_model,
        baseUrl: profile.image_base_url,
      };
    }
  }

  const localConfig = await getLocalAiConfig();
  if (!localConfig.image_provider) return null;
  return {
    provider: localConfig.image_provider as ImageProvider,
    apiKey: localConfig.image_api_key || localConfig.ai_api_key || process.env.MUAPI_API_KEY || null,
    model: localConfig.image_model || null,
    baseUrl: localConfig.image_base_url || null,
  };
}

export async function ensureProductImage(product: AffiliateProduct, force = false) {
  const hasSupplierImage = Boolean(product.image_url);
  if (hasSupplierImage && !force) {
    if (!product.image_source) {
      await getAdminDb().update("affiliate_products", { id: product.id }, { image_source: "supplier" });
    }
    return { skipped: true, reason: "supplier_image_exists", image_url: product.image_url };
  }

  const imageConfig = await resolveProductImageConfig(product);
  if (!imageConfig) throw new Error("Configura un proveedor de imagen IA antes de generar fotos de producto.");

  const generated = await generateProductImage(imageConfig, product);
  await getAdminDb().update("affiliate_products", { id: product.id }, {
    image_url: generated.imageUrl,
    images: [generated.imageUrl],
    image_source: "ai",
    image_prompt: generated.prompt,
    image_generated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return {
    skipped: false,
    reason: "ai_image_generated",
    image_url: generated.imageUrl,
    provider: generated.provider,
    model: generated.model,
  };
}

export async function fillMissingProductImages(userId?: string | null, limit = 10) {
  const db = getAdminDb();
  const query: Record<string, string> = {
    select: "*",
    image_url: "is.null",
    is_active: "eq.true",
    limit: String(limit),
  };
  if (userId) query.user_id = `eq.${userId}`;
  const products = await db.select<AffiliateProduct>("affiliate_products", query);
  const results = [];
  for (const product of products) {
    try {
      results.push({ product_id: product.id, ok: true, ...(await ensureProductImage(product, true)) });
    } catch (error) {
      results.push({ product_id: product.id, ok: false, error: error instanceof Error ? error.message : "Error generando imagen" });
    }
  }
  return results;
}
