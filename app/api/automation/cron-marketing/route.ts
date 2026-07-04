import { NextRequest, NextResponse } from "next/server";
import { generateMarketingContent } from "@/lib/marketing/ai-content";
import { createProductCampaign, getMetaConfig, getAdInsights, rebalanceBudgets } from "@/lib/marketing/meta-ads";
import { publishToAllNetworks } from "@/lib/marketing/social-publisher";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct } from "@/types";
import type { MarketingContent, MetaCampaign } from "@/lib/marketing/types";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}` || req.nextUrl.searchParams.get("secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const db = getAdminDb();
  const products = await db.select<AffiliateProduct>("affiliate_products", {
    select: "*",
    is_active: "eq.true",
    order: "created_at.desc",
    limit: "20",
  });
  const existing = await db.select<MarketingContent>("marketing_content", { select: "*" });
  const existingIds = new Set(existing.map((item) => item.product_id));
  const generated: string[] = [];
  const published: string[] = [];
  const campaigns: string[] = [];
  const errors: Array<{ product: string; error: string }> = [];

  for (const product of products.filter((item) => !existingIds.has(item.id)).slice(0, 8)) {
    try {
      const content = await generateMarketingContent(product);
      generated.push(product.id);
      try {
        await publishToAllNetworks(product);
        published.push(product.id);
      } catch {
        // Si una red no esta conectada, el contenido queda listo para publicar manualmente.
      }
      const metaConfig = await getMetaConfig(product.user_id || null);
      if (metaConfig && Number(content.priority_score) >= Number(metaConfig.min_priority_score || 7) && metaConfig.auto_distribute) {
        const campaign = await createProductCampaign(product, Number(metaConfig.monthly_budget || 50), metaConfig);
        campaigns.push(campaign.id);
      }
    } catch (error) {
      errors.push({ product: product.id, error: String(error instanceof Error ? error.message : error) });
    }
  }

  const metaConfig = await getMetaConfig(null);
  if (metaConfig) {
    const activeCampaigns = await db.select<MetaCampaign>("meta_campaigns", { select: "*", status: "eq.active" });
    if (activeCampaigns.length) await getAdInsights(metaConfig, activeCampaigns);
    const day = new Date().getUTCDate();
    if (day % 3 === 0) await rebalanceBudgets(null, Number(metaConfig.monthly_budget || 50));
  }

  await db.insert("agent_logs", {
    user_id: null,
    action: "cron_marketing",
    status: errors.length ? "error" : "success",
    details: { generated, published, campaigns, errors },
  });
  return NextResponse.json({ generated, published, campaigns, errors });
}

export const POST = GET;
