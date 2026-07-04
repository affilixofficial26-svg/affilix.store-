import { decryptSecret } from "@/lib/security";
import { getAdminDb } from "@/lib/supabase";
import { fetchWithTimeout, retry } from "@/lib/utils";
import { getOrGenerateContent } from "@/lib/marketing/ai-content";
import { getPublicProductUrl } from "@/lib/store-links";
import type { AffiliateProduct } from "@/types";
import type { MetaCampaign, MetaConfig } from "@/lib/marketing/types";

const META_GRAPH_VERSION = "v24.0";
const META_GRAPH_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

function normalizeAdAccount(id: string) {
  return id.startsWith("act_") ? id : `act_${id}`;
}

function accessToken(config: MetaConfig) {
  const value = decryptSecret(config.access_token || "");
  if (!value) throw new Error("Falta access token de Meta Ads");
  return value;
}

async function metaPost(endpoint: string, token: string, data: Record<string, unknown>) {
  const res = await retry(() => fetchWithTimeout(`${META_GRAPH_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, access_token: token }),
  }, 30000), 3, 800);
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error?.message || `Meta API ${res.status}`);
  return json as { id: string; images?: Record<string, { hash: string }> };
}

async function metaGet(endpoint: string, token: string, params: Record<string, string>) {
  const query = new URLSearchParams({ ...params, access_token: token });
  const res = await retry(() => fetchWithTimeout(`${META_GRAPH_URL}${endpoint}?${query.toString()}`, {}, 30000), 3, 800);
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error?.message || `Meta API ${res.status}`);
  return json;
}

export async function getMetaConfig(userId: string | null) {
  const rows = await getAdminDb().select<MetaConfig>("meta_config", {
    select: "*",
    user_id: userId ? `eq.${userId}` : "is.null",
    limit: "1",
  });
  return rows[0] || null;
}

function interestsForCategory(category?: string | null) {
  const value = (category || "").toLowerCase();
  if (value.includes("masc")) return [{ id: "6003139266461", name: "Pets" }];
  if (value.includes("fitness") || value.includes("deporte")) return [{ id: "6003139266461", name: "Fitness and wellness" }];
  if (value.includes("belleza")) return [{ id: "6002867432822", name: "Beauty" }];
  return [{ id: "6003372865732", name: "Online shopping" }];
}

export async function createProductCampaign(product: AffiliateProduct, budget: number, config: MetaConfig, options?: { destinationUrl?: string; campaignNamePrefix?: string }) {
  if (!config.ad_account_id || !config.page_id) throw new Error("Faltan Ad Account ID o Page ID de Meta");
  if (!product.image_url) throw new Error("Meta Ads requiere imagen publica del producto");
  const token = accessToken(config);
  const adAccount = normalizeAdAccount(config.ad_account_id);
  const content = await getOrGenerateContent(product);
  const productUrl = options?.destinationUrl || getPublicProductUrl(product);
  const adVariant = content.meta_ad_variants[0] || {
    headline: product.ai_title || product.title,
    primary_text: content.facebook_post || product.description || product.title,
    description: "Comprar ahora",
  };

  const campaign = await metaPost(`/${adAccount}/campaigns`, token, {
    name: `${options?.campaignNamePrefix || "AFFILIX"} - ${product.title}`.slice(0, 120),
    objective: "OUTCOME_TRAFFIC",
    status: "PAUSED",
    special_ad_categories: [],
  });
  const adset = await metaPost(`/${adAccount}/adsets`, token, {
    name: `${options?.campaignNamePrefix || "AFFILIX"} AdSet - ${product.title}`.slice(0, 120),
    campaign_id: campaign.id,
    daily_budget: Math.max(100, Math.round((budget / 30) * 100)),
    billing_event: "IMPRESSIONS",
    optimization_goal: "LINK_CLICKS",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    promoted_object: { page_id: config.page_id },
    targeting: {
      geo_locations: { countries: ["ES", "MX", "AR", "CO", "US"] },
      interests: interestsForCategory(product.category),
    },
    status: "PAUSED",
  });
  const image = await metaPost(`/${adAccount}/adimages`, token, { url: product.image_url });
  const imageHash = Object.values(image.images || {})[0]?.hash;
  if (!imageHash) throw new Error("Meta no devolvio hash de imagen");
  const creative = await metaPost(`/${adAccount}/adcreatives`, token, {
    name: `${options?.campaignNamePrefix || "AFFILIX"} Creative - ${product.title}`.slice(0, 120),
    object_story_spec: {
      page_id: config.page_id,
      link_data: {
        image_hash: imageHash,
        link: productUrl,
        message: adVariant.primary_text,
        name: adVariant.headline,
        description: adVariant.description,
        call_to_action: { type: "SHOP_NOW", value: { link: productUrl } },
      },
    },
  });
  const ad = await metaPost(`/${adAccount}/ads`, token, {
    name: `${options?.campaignNamePrefix || "AFFILIX"} Ad - ${product.title}`.slice(0, 120),
    adset_id: adset.id,
    creative: { creative_id: creative.id },
    status: "PAUSED",
  });

  const rows = await getAdminDb().insert<MetaCampaign>("meta_campaigns", {
    product_id: product.id,
    user_id: product.user_id || null,
    campaign_id: campaign.id,
    adset_id: adset.id,
    ad_id: ad.id,
    daily_budget: Number((budget / 30).toFixed(2)),
    status: "paused",
  });
  await getAdminDb().insert("publish_log", {
    product_id: product.id,
    user_id: product.user_id || null,
    platform: "meta_ads",
    platform_post_id: ad.id,
    status: "success",
  });
  return rows[0];
}

export async function getAdInsights(config: MetaConfig, campaigns: MetaCampaign[]) {
  const token = accessToken(config);
  return Promise.all(campaigns.map(async (campaign) => {
    const data = await metaGet(`/${campaign.campaign_id}/insights`, token, {
      fields: "impressions,clicks,ctr,spend,purchase_roas",
      date_preset: "last_30d",
    });
    const row = data.data?.[0] || {};
    const updated = {
      total_impressions: Number(row.impressions || 0),
      total_clicks: Number(row.clicks || 0),
      ctr: Number(row.ctr || 0),
      total_spent: Number(row.spend || 0),
      roas: Number(row.purchase_roas?.[0]?.value || 0),
      last_synced: new Date().toISOString(),
    };
    await getAdminDb().update<MetaCampaign>("meta_campaigns", { id: campaign.id }, updated);
    return { ...campaign, ...updated };
  }));
}

export async function pauseCampaign(campaignId: string, config: MetaConfig) {
  return metaPost(`/${campaignId}`, accessToken(config), { status: "PAUSED" });
}

export async function resumeCampaign(campaignId: string, config: MetaConfig) {
  return metaPost(`/${campaignId}`, accessToken(config), { status: "ACTIVE" });
}

export async function deleteCampaign(campaignId: string, config: MetaConfig) {
  return metaPost(`/${campaignId}`, accessToken(config), { status: "DELETED" });
}

export async function rebalanceBudgets(userId: string | null, totalBudget: number) {
  const campaigns = await getAdminDb().select<MetaCampaign>("meta_campaigns", {
    select: "*",
    user_id: userId ? `eq.${userId}` : "is.null",
    status: "eq.active",
  });
  if (!campaigns.length) return [];
  const totalScore = campaigns.reduce((sum, item) => sum + Math.max(1, Number(item.ctr || 1) + Number(item.roas || 0)), 0);
  return Promise.all(campaigns.map((campaign) => {
    const weight = (Math.max(1, Number(campaign.ctr || 1) + Number(campaign.roas || 0)) / totalScore);
    return getAdminDb().update<MetaCampaign>("meta_campaigns", { id: campaign.id }, {
      daily_budget: Number(((totalBudget * weight) / 30).toFixed(2)),
      last_synced: new Date().toISOString(),
    });
  }));
}
