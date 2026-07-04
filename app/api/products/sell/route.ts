import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLocalPlatformAccounts } from "@/lib/local-platform-accounts";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct } from "@/types";

const sellSchema = z.object({
  product_id: z.string().uuid(),
  target_platform: z.enum(["amazon_seller"]).default("amazon_seller"),
});

function isConnectedSellerAccount(platform: string) {
  return platform === "amazon_seller";
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const parsed = sellSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Producto o plataforma invalida" }, { status: 400 });

  const accounts = await getLocalPlatformAccounts();
  const sellerAccount = accounts.find((account) => isConnectedSellerAccount(account.platform) && account.connected);
  if (!sellerAccount) {
    return NextResponse.redirect(new URL("/dashboard/accounts?connect=amazon_seller", req.url), 303);
  }

  const db = getAdminDb();
  const product = (await db.select<AffiliateProduct>("affiliate_products", {
    select: "*",
    id: `eq.${parsed.data.product_id}`,
    limit: "1",
  }))[0];

  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  if (!product.title || !product.affiliate_url) return NextResponse.json({ error: "Faltan titulo o URL del producto" }, { status: 400 });

  await db.update<AffiliateProduct>(
    "affiliate_products",
    { id: parsed.data.product_id },
    {
      is_active: true,
      image_source: product.image_url ? "supplier" : product.image_source,
      auto_published: true,
      updated_at: new Date().toISOString(),
    },
  );

  await db.insert("agent_logs", {
    user_id: product.user_id || null,
    action: "product_sell_automation_ready",
    details: {
      product_id: product.id,
      title: product.title,
      target_platform: parsed.data.target_platform,
      note: "Producto activado en AFFILIX. Para publicacion directa en Amazon se requiere completar OAuth/SP-API y Listings Items API.",
    },
    status: "success",
  });

  return NextResponse.redirect(new URL("/dashboard/products", req.url), 303);
}
