import { generateText } from "@/lib/openai-client";
import { getLocalAiConfig } from "@/lib/local-ai-config";
import { getAdminDb } from "@/lib/supabase";
import { getPublicProductUrl } from "@/lib/store-links";
import type { AffiliateProduct, AiProvider } from "@/types";
import type { MarketingContent, UserAiConfig } from "@/lib/marketing/types";

function extractJson(raw: string) {
  const clean = raw.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("La IA no devolvio JSON valido");
  return JSON.parse(clean.slice(start, end + 1));
}

function fallbackPriority(product: AffiliateProduct) {
  const commission = Number(product.commission_rate || 3);
  const rating = Number(product.rating || 4);
  const price = Math.min(Number(product.price || 30), 300) / 300;
  return Math.max(1, Math.min(10, Number(((commission * 0.45) + (rating * 1.1) + (price * 2)).toFixed(2))));
}

function normalizeVariant(value: unknown) {
  const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    headline: String(item.headline || "Oferta destacada").slice(0, 40),
    primary_text: String(item.primary_text || "Descubre este producto antes de que suba de precio.").slice(0, 125),
    description: String(item.description || "Compra ahora").slice(0, 30),
  };
}

async function getAiConfig(userId: string | null) {
  if (!userId) {
    const localConfig = await getLocalAiConfig();
    return {
      ai_provider: (localConfig.ai_provider || "ollama") as AiProvider,
      ai_model: localConfig.ai_model || "qwen2.5:7b",
      ai_api_key: localConfig.ai_api_key || process.env.MUAPI_API_KEY || null,
      ollama_base_url: localConfig.ollama_base_url || "http://localhost:11434",
    } satisfies UserAiConfig;
  }
  const rows = await getAdminDb().select<UserAiConfig>("user_profiles", {
    select: "id,ai_provider,ai_model,ai_api_key,ollama_base_url",
    id: `eq.${userId}`,
    limit: "1",
  });
  return rows[0] || null;
}

function buildPrompt(product: AffiliateProduct) {
  const productUrl = getPublicProductUrl(product);
  return `Genera contenido de marketing en espanol para este producto de tienda online.
Devuelve SOLO JSON valido, sin markdown.

Producto:
- Titulo: ${product.ai_title || product.title}
- Descripcion: ${product.ai_description || product.description || "No disponible"}
- Precio: ${product.price ?? "No disponible"} ${product.currency || "USD"}
- Categoria: ${product.category || "general"}
- Rating: ${product.rating ?? "No disponible"}
- Reviews: ${product.review_count ?? "No disponible"}
- URL publica del producto: ${productUrl}

Formato exacto:
{
  "facebook_post": "200 a 250 palabras, hook, beneficios, CTA, hashtags y emojis moderados",
  "instagram_caption": "maximo 150 caracteres + hasta 25 hashtags",
  "pinterest_description": "descripcion SEO de maximo 500 caracteres",
  "twitter_post": "maximo 260 caracteres con CTA",
  "meta_ad_variants": [
    {"headline":"max 40 caracteres","primary_text":"max 125 caracteres","description":"max 30 caracteres"},
    {"headline":"max 40 caracteres","primary_text":"max 125 caracteres","description":"max 30 caracteres"},
    {"headline":"max 40 caracteres","primary_text":"max 125 caracteres","description":"max 30 caracteres"}
  ],
  "priority_score": 1-10
}`;
}

export async function generateMarketingContent(product: AffiliateProduct) {
  const db = getAdminDb();
  await db.upsert<MarketingContent>(
    "marketing_content",
    {
      product_id: product.id,
      user_id: product.user_id || null,
      content_status: "generating",
    },
    "product_id",
  );

  try {
    const aiConfig = await getAiConfig(product.user_id || null);
    if (!aiConfig?.ai_provider) throw new Error("Configura un proveedor de IA antes de generar marketing");
    const raw = await generateText({
      provider: aiConfig.ai_provider,
      model: aiConfig.ai_model,
      apiKey: aiConfig.ai_api_key,
      ollamaBaseUrl: aiConfig.ollama_base_url,
    }, buildPrompt(product));
    const json = extractJson(raw);
    const content = {
      product_id: product.id,
      user_id: product.user_id || null,
      facebook_post: String(json.facebook_post || "").slice(0, 5000),
      instagram_caption: String(json.instagram_caption || "").slice(0, 1200),
      pinterest_description: String(json.pinterest_description || "").slice(0, 500),
      twitter_post: String(json.twitter_post || "").slice(0, 280),
      meta_ad_variants: Array.isArray(json.meta_ad_variants) ? json.meta_ad_variants.slice(0, 3).map(normalizeVariant) : [],
      priority_score: Number(json.priority_score || fallbackPriority(product)),
      content_status: "ready",
      generated_at: new Date().toISOString(),
    };
    const rows = await db.upsert<MarketingContent>("marketing_content", content, "product_id");
    return rows[0];
  } catch (error) {
    await db.upsert<MarketingContent>(
      "marketing_content",
      {
        product_id: product.id,
        user_id: product.user_id || null,
        priority_score: fallbackPriority(product),
        content_status: "error",
      },
      "product_id",
    );
    throw error;
  }
}

export async function getOrGenerateContent(product: AffiliateProduct) {
  const rows = await getAdminDb().select<MarketingContent>("marketing_content", {
    select: "*",
    product_id: `eq.${product.id}`,
    limit: "1",
  });
  if (rows[0]?.content_status === "ready" || rows[0]?.content_status === "published") return rows[0];
  return generateMarketingContent(product);
}
