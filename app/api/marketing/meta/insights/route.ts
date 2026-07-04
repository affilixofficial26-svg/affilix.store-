import { NextResponse } from "next/server";
import { getAdInsights, getMetaConfig } from "@/lib/marketing/meta-ads";
import { getAdminDb } from "@/lib/supabase";
import type { MetaCampaign } from "@/lib/marketing/types";

export async function GET() {
  const config = await getMetaConfig(null);
  if (!config) return NextResponse.json({ campaigns: [], warning: "Meta Ads no esta conectado" });
  const campaigns = await getAdminDb().select<MetaCampaign>("meta_campaigns", { select: "*", status: "eq.active" });
  const insights = await getAdInsights(config, campaigns);
  return NextResponse.json({ campaigns: insights });
}
