import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createProductCampaign, getMetaConfig } from "@/lib/marketing/meta-ads";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct } from "@/types";

const schema = z.object({ productId: z.string().uuid(), budget: z.coerce.number().min(1).max(100000) });

export async function POST(req: NextRequest) {
  const isJson = req.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    if (!isJson) return NextResponse.redirect(new URL("/dashboard/marketing?meta=error&message=Campana%20invalida", req.url), 303);
    return NextResponse.json({ error: "Campana invalida" }, { status: 400 });
  }
  try {
    const product = (await getAdminDb().select<AffiliateProduct>("affiliate_products", { select: "*", id: `eq.${parsed.data.productId}`, limit: "1" }))[0];
    if (!product) throw new Error("Producto no encontrado");
    const config = await getMetaConfig(product.user_id || null);
    if (!config) throw new Error("Conecta Meta Ads primero");
    const campaign = await createProductCampaign(product, parsed.data.budget, config);
    if (isJson) return NextResponse.json({ campaign });
    return NextResponse.redirect(new URL("/dashboard/marketing/meta-ads?campaign=ok", req.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el anuncio";
    if (!isJson) {
      const url = new URL("/dashboard/marketing", req.url);
      url.searchParams.set("meta", "error");
      url.searchParams.set("message", message);
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
