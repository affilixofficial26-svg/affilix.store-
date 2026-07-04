import { NextRequest, NextResponse } from "next/server";
import { ensureProductImage } from "@/lib/product-images";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct } from "@/types";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
  if (!body.product_id) return NextResponse.json({ error: "product_id es obligatorio" }, { status: 400 });
  const product = (await getAdminDb().select<AffiliateProduct>("affiliate_products", { select: "*", id: `eq.${body.product_id}`, limit: "1" }))[0];
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  try {
    const result = await ensureProductImage(product, Boolean(body.force));
    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(new URL(`/dashboard/products/${product.id}?image=ok`, req.url), 303);
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (!contentType.includes("application/json")) {
      const url = new URL(`/dashboard/products/${product.id}`, req.url);
      url.searchParams.set("image", "error");
      url.searchParams.set("message", error instanceof Error ? error.message.slice(0, 160) : "No se pudo generar la imagen");
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo generar la imagen" }, { status: 500 });
  }
}
