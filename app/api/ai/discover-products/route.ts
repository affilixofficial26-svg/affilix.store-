import { NextRequest, NextResponse } from "next/server";
import { discoverProducts } from "@/lib/product-discovery";
import { getAdminDb } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const keywords = String(body.keywords || "");
  if (!keywords.trim()) return NextResponse.json({ error: "keywords es obligatorio" }, { status: 400 });
  const result = await discoverProducts(keywords, body.platform || "all");
  await getAdminDb().insert("agent_logs", { user_id: body.user_id || null, action: "discover_products", details: { keywords, total: result.products.length, errors: result.errors }, status: "success" });
  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(new URL(`/dashboard/niche-factory?keywords=${encodeURIComponent(keywords)}&platform=${encodeURIComponent(String(body.platform || "all"))}`, req.url), 303);
  }
  return NextResponse.json({ ok: true, products: result.products, errors: result.errors, slug: slugify(keywords) });
}
