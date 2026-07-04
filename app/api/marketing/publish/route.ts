import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { publishToAllNetworks } from "@/lib/marketing/social-publisher";
import { getAdminDb } from "@/lib/supabase";
import type { MarketingPlatform } from "@/lib/marketing/types";
import type { AffiliateProduct } from "@/types";

const schema = z.object({
  productId: z.string().uuid(),
  platforms: z.union([z.array(z.enum(["facebook", "instagram", "pinterest", "twitter"])), z.string()]).optional(),
});

function platformsFromForm(value: unknown): MarketingPlatform[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value as MarketingPlatform[];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean) as MarketingPlatform[];
}

export async function POST(req: NextRequest) {
  const isJson = req.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    if (!isJson) return NextResponse.redirect(new URL("/dashboard/marketing?publish=error", req.url), 303);
    return NextResponse.json({ error: "Publicacion invalida" }, { status: 400 });
  }
  try {
    const product = (await getAdminDb().select<AffiliateProduct>("affiliate_products", { select: "*", id: `eq.${parsed.data.productId}`, limit: "1" }))[0];
    if (!product) throw new Error("Producto no encontrado");
    const results = await publishToAllNetworks(product, platformsFromForm(parsed.data.platforms));
    if (isJson) return NextResponse.json({ results });
    return NextResponse.redirect(new URL("/dashboard/marketing?publish=ok", req.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo publicar";
    if (!isJson) {
      const url = new URL("/dashboard/marketing", req.url);
      url.searchParams.set("publish", "error");
      url.searchParams.set("message", message);
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
