import { decryptSecret } from "@/lib/security";
import { getAdminDb } from "@/lib/supabase";
import { fetchWithTimeout, retry } from "@/lib/utils";
import { getOrGenerateContent } from "@/lib/marketing/ai-content";
import { getPublicProductUrl } from "@/lib/store-links";
import type { AffiliateProduct } from "@/types";
import type { MarketingContent, MarketingPlatform, SocialConfig } from "@/lib/marketing/types";

const META_GRAPH_VERSION = "v24.0";
const META_GRAPH_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

function token(value?: string | null) {
  return decryptSecret(value || "");
}

async function logPublish(product: AffiliateProduct, platform: MarketingPlatform | "meta_ads", status: "success" | "error" | "pending", platformPostId?: string, errorMessage?: string) {
  await getAdminDb().insert("publish_log", {
    product_id: product.id,
    user_id: product.user_id || null,
    platform,
    platform_post_id: platformPostId || null,
    status,
    error_message: errorMessage || null,
  });
}

async function graphPost(endpoint: string, data: Record<string, unknown>, accessToken: string) {
  const res = await retry(() => fetchWithTimeout(`${META_GRAPH_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, access_token: accessToken }),
  }, 30000), 3, 700);
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error?.message || `Meta API ${res.status}`);
  return json as { id?: string; post_id?: string; creation_id?: string };
}

export async function publishToFacebook(content: MarketingContent, product: AffiliateProduct, config: SocialConfig) {
  const pageId = config.facebook_page_id;
  const pageToken = token(config.facebook_page_token);
  if (!pageId || !pageToken) throw new Error("Faltan page ID o token de Facebook");
  const productUrl = getPublicProductUrl(product);
  const result = await graphPost(`/${pageId}/photos`, {
    url: product.image_url,
    caption: `${content.facebook_post}\n${productUrl}`,
    published: true,
  }, pageToken);
  await logPublish(product, "facebook", "success", result.post_id || result.id);
  return result;
}

export async function publishToInstagram(content: MarketingContent, product: AffiliateProduct, config: SocialConfig) {
  const instagramId = config.instagram_business_id;
  const instagramToken = token(config.instagram_token);
  if (!instagramId || !instagramToken) throw new Error("Faltan Instagram Business ID o token");
  if (!product.image_url) throw new Error("Instagram requiere imagen publica del producto");
  const productUrl = getPublicProductUrl(product);
  const container = await graphPost(`/${instagramId}/media`, {
    image_url: product.image_url,
    caption: `${content.instagram_caption}\n${productUrl}`,
  }, instagramToken);
  if (!container.id) throw new Error("Instagram no devolvio creation_id");
  const published = await graphPost(`/${instagramId}/media_publish`, { creation_id: container.id }, instagramToken);
  await logPublish(product, "instagram", "success", published.id);
  return published;
}

export async function publishToPinterest(content: MarketingContent, product: AffiliateProduct, config: SocialConfig) {
  const pinterestToken = token(config.pinterest_token);
  if (!pinterestToken || !config.pinterest_board_id) throw new Error("Faltan token o board ID de Pinterest");
  if (!product.image_url) throw new Error("Pinterest requiere imagen publica del producto");
  const productUrl = getPublicProductUrl(product);
  const res = await retry(() => fetchWithTimeout("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: { Authorization: `Bearer ${pinterestToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      board_id: config.pinterest_board_id,
      title: (product.seo_title || product.ai_title || product.title).slice(0, 100),
      description: (content.pinterest_description || content.facebook_post || "").slice(0, 500),
      link: productUrl,
      media_source: { source_type: "image_url", url: product.image_url },
    }),
  }, 30000), 3, 700);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Pinterest API ${res.status}`);
  await logPublish(product, "pinterest", "success", json.id);
  return json;
}

export async function publishToTwitter(content: MarketingContent, product: AffiliateProduct, config: SocialConfig) {
  const bearer = token(config.twitter_bearer_token || config.twitter_access_token);
  if (!bearer) throw new Error("Falta token de X/Twitter");
  const productUrl = getPublicProductUrl(product);
  const res = await retry(() => fetchWithTimeout("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: `${content.twitter_post || product.title}\n${productUrl}`.slice(0, 280) }),
  }, 30000), 3, 700);
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || json.title || `X API ${res.status}`);
  await logPublish(product, "twitter", "success", json.data?.id);
  return json;
}

export async function getUserSocialConfig(userId: string | null) {
  const rows = await getAdminDb().select<SocialConfig>("social_accounts", {
    select: "*",
    user_id: userId ? `eq.${userId}` : "is.null",
    limit: "1",
  });
  return rows[0] || null;
}

export async function publishToAllNetworks(product: AffiliateProduct, platforms?: MarketingPlatform[]) {
  const config = await getUserSocialConfig(product.user_id || null);
  if (!config) throw new Error("Conecta al menos una red social en Marketing > Cuentas sociales");
  const content = await getOrGenerateContent(product);
  const enabled = new Set(platforms || []);
  const runAll = !platforms?.length;
  const jobs: Array<Promise<unknown>> = [];

  if ((runAll || enabled.has("facebook")) && config.facebook_enabled) jobs.push(publishToFacebook(content, product, config).catch(async (error) => {
    await logPublish(product, "facebook", "error", undefined, String(error.message || error));
    throw error;
  }));
  if ((runAll || enabled.has("instagram")) && config.instagram_enabled) jobs.push(publishToInstagram(content, product, config).catch(async (error) => {
    await logPublish(product, "instagram", "error", undefined, String(error.message || error));
    throw error;
  }));
  if ((runAll || enabled.has("pinterest")) && config.pinterest_enabled) jobs.push(publishToPinterest(content, product, config).catch(async (error) => {
    await logPublish(product, "pinterest", "error", undefined, String(error.message || error));
    throw error;
  }));
  if ((runAll || enabled.has("twitter")) && config.twitter_enabled) jobs.push(publishToTwitter(content, product, config).catch(async (error) => {
    await logPublish(product, "twitter", "error", undefined, String(error.message || error));
    throw error;
  }));

  if (!jobs.length) throw new Error("No hay redes habilitadas para publicar");
  const results = await Promise.allSettled(jobs);
  await getAdminDb().upsert<MarketingContent>("marketing_content", {
    product_id: product.id,
    user_id: product.user_id || null,
    content_status: results.some((item) => item.status === "fulfilled") ? "published" : "error",
  }, "product_id");
  return results;
}
