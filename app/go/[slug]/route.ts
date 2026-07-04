import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";
import { trackClick } from "@/lib/tracking";
import type { AffiliateProduct } from "@/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getAdminDb();
  const product = (await db.select<AffiliateProduct>("affiliate_products", { select: "*", slug: `eq.${slug}`, is_active: "eq.true", limit: "1" }))[0];
  if (!product) return NextResponse.redirect(new URL("/store", req.url));
  await trackClick(req, product);
  return NextResponse.redirect(product.affiliate_url, 302);
}
