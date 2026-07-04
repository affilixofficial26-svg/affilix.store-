import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";
import { trackClick } from "@/lib/tracking";
import type { AffiliateProduct } from "@/types";

export async function POST(req: NextRequest) {
  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug es obligatorio" }, { status: 400 });
  const product = (await getAdminDb().select<AffiliateProduct>("affiliate_products", { select: "*", slug: `eq.${slug}`, limit: "1" }))[0];
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  await trackClick(req, product);
  return NextResponse.json({ ok: true, redirect: product.affiliate_url });
}
