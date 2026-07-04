import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveProviderImageUrl } from "@/lib/provider-image";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct } from "@/types";

const publishSchema = z.object({
  product_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const parsed = publishSchema.safeParse(data);
  if (!parsed.success) {
    if (contentType.includes("application/json")) return NextResponse.json({ error: "Producto invalido" }, { status: 400 });
    return NextResponse.redirect(new URL("/dashboard/products?publish=error&message=Producto%20invalido", req.url), 303);
  }

  const db = getAdminDb();
  const product = (await db.select<AffiliateProduct>("affiliate_products", {
    select: "*",
    id: `eq.${parsed.data.product_id}`,
    limit: "1",
  }))[0];

  if (!product) {
    if (contentType.includes("application/json")) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    return NextResponse.redirect(new URL("/dashboard/products?publish=error&message=Producto%20no%20encontrado", req.url), 303);
  }

  let imageUrl = product.image_url;
  if (!imageUrl) {
    try {
      imageUrl = await resolveProviderImageUrl(product.affiliate_url);
    } catch {
      if (contentType.includes("application/json")) return NextResponse.json({ error: "Sube una foto antes de publicar" }, { status: 400 });
      return NextResponse.redirect(new URL("/dashboard/products?publish=error&message=Sube%20una%20foto%20antes%20de%20publicar", req.url), 303);
    }
  }

  const rows = await db.update<AffiliateProduct>(
    "affiliate_products",
    { id: product.id },
    {
      is_active: true,
      auto_published: true,
      image_url: imageUrl,
      images: [imageUrl],
      image_source: product.image_source || "supplier",
      updated_at: new Date().toISOString(),
    },
  );

  await db.insert("agent_logs", {
    user_id: product.user_id || null,
    action: "product_published_to_public_store",
    details: { product_id: product.id, title: product.title, slug: product.slug },
    status: "success",
  });

  if (contentType.includes("application/json")) return NextResponse.json({ ok: true, product: rows[0] || null });
  return NextResponse.redirect(new URL("/dashboard/products?publish=ok", req.url), 303);
}
