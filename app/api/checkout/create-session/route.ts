import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

const schema = z.object({
  catalog_item_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  customer_email: z.string().email().optional(),
});

type Item = { id: string; title: string; short_description: string | null; item_type: string; price: number | string | null; currency: string; image_url: string | null };

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Solicitud de compra no válida." }, { status: 400 });
    const db = getAdminDb();
    const [item] = await db.select<Item>("catalog_items", { select: "id,title,short_description,item_type,price,currency,image_url", id: `eq.${parsed.data.catalog_item_id}`, status: "eq.published", limit: "1" });
    if (!item || item.price == null || Number(item.price) <= 0) return NextResponse.json({ error: "Producto no disponible." }, { status: 404 });

    const quantity = parsed.data.quantity;
    const cents = Math.round(Number(item.price) * 100);
    const [order] = await db.insert<{ id: string }>("customer_orders", {
      customer_email: parsed.data.customer_email || "pendiente@checkout.affilix.store",
      status: "pending", currency: item.currency || "EUR", subtotal: cents * quantity / 100,
      total: cents * quantity / 100, payment_provider: "stripe", metadata: { source: "stripe_checkout" },
    });
    if (!order) throw new Error("No se pudo crear el pedido.");
    await db.insert("order_items", { order_id: order.id, catalog_item_id: item.id, title: item.title, quantity, unit_price: cents / 100, total: cents * quantity / 100 });

    const origin = process.env.NEXT_PUBLIC_STORE_URL || "https://affilix.store";
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: parsed.data.customer_email,
      line_items: [{ quantity, price_data: { currency: (item.currency || "EUR").toLowerCase(), unit_amount: cents, product_data: { name: item.title, description: item.short_description || undefined, images: item.image_url ? [item.image_url] : undefined } } }],
      metadata: { order_id: order.id, catalog_item_id: item.id, item_type: item.item_type },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel?order_id=${order.id}`,
      billing_address_collection: "auto",
      allow_promotion_codes: true,
    });
    await db.update("customer_orders", { id: order.id }, { payment_reference: session.id });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Checkout] Error", { message: error instanceof Error ? error.message : "Error desconocido" });
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 500 });
  }
}
