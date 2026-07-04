import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveProviderImageUrl } from "@/lib/provider-image";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct } from "@/types";

const fetchImageSchema = z.object({
  product_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const parsed = fetchImageSchema.safeParse(data);
  const referer = req.headers.get("referer") || "/dashboard/products";

  if (!parsed.success) {
    if (contentType.includes("application/json")) return NextResponse.json({ error: "Producto invalido" }, { status: 400 });
    return NextResponse.redirect(new URL(`${referer}?images=error&message=Producto%20invalido`, req.url), 303);
  }

  const db = getAdminDb();
  const product = (await db.select<AffiliateProduct>("affiliate_products", {
    select: "*",
    id: `eq.${parsed.data.product_id}`,
    limit: "1",
  }))[0];

  if (!product) {
    if (contentType.includes("application/json")) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    return NextResponse.redirect(new URL(`${referer}?images=error&message=Producto%20no%20encontrado`, req.url), 303);
  }

  try {
    const imageUrl = await resolveProviderImageUrl(product.affiliate_url);
    const rows = await db.update<AffiliateProduct>("affiliate_products", { id: product.id }, {
      image_url: imageUrl,
      images: [imageUrl],
      image_source: "supplier",
      is_active: true,
      auto_published: true,
      updated_at: new Date().toISOString(),
    });

    if (contentType.includes("application/json")) return NextResponse.json({ ok: true, product: rows[0] || null });
    return NextResponse.redirect(new URL(`${referer}?images=ok&processed=1`, req.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar foto del proveedor";
    if (contentType.includes("application/json")) return NextResponse.json({ error: message }, { status: 400 });
    const url = new URL(referer, req.url);
    url.searchParams.set("images", "error");
    url.searchParams.set("message", message);
    return NextResponse.redirect(url, 303);
  }
}
