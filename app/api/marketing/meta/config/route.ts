import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encryptSecret } from "@/lib/security";
import { getAdminDb } from "@/lib/supabase";
import type { MetaConfig } from "@/lib/marketing/types";

const schema = z.object({
  access_token: z.string().trim().max(5000).optional(),
  ad_account_id: z.string().trim().max(200).optional(),
  page_id: z.string().trim().max(200).optional(),
  pixel_id: z.string().trim().max(200).optional(),
  monthly_budget: z.coerce.number().min(1).max(100000).default(50),
  auto_distribute: z.coerce.boolean().optional(),
  min_priority_score: z.coerce.number().min(1).max(10).default(7),
});

export async function POST(req: NextRequest) {
  const form = Object.fromEntries((await req.formData()).entries());
  const parsed = schema.safeParse({ ...form, auto_distribute: form.auto_distribute === "on" });
  if (!parsed.success) return NextResponse.json({ error: "Configuracion Meta invalida" }, { status: 400 });
  const existing = (await getAdminDb().select<MetaConfig>("meta_config", { select: "*", user_id: "is.null", limit: "1" }))[0];
  const payload = {
    user_id: null,
    access_token: parsed.data.access_token ? encryptSecret(parsed.data.access_token) : existing?.access_token || null,
    ad_account_id: parsed.data.ad_account_id || null,
    page_id: parsed.data.page_id || null,
    pixel_id: parsed.data.pixel_id || null,
    monthly_budget: parsed.data.monthly_budget,
    auto_distribute: Boolean(parsed.data.auto_distribute),
    min_priority_score: parsed.data.min_priority_score,
    updated_at: new Date().toISOString(),
  };
  if (existing?.id) {
    await getAdminDb().update("meta_config", { id: existing.id }, payload);
  } else {
    await getAdminDb().insert("meta_config", payload);
  }
  return NextResponse.redirect(new URL("/dashboard/marketing/meta-ads", req.url), 303);
}
