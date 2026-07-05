import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPayPalEnvironment, isPayPalConfigured, paypalRequest } from "@/lib/paypal";
import { getAdminDb } from "@/lib/supabase";

const schema = z.object({
  catalog_item_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  customer_email: z.string().email().optional(),
});

type CatalogItem = {
  id: string;
  title: string;
  price: number | string | null;
  currency: string;
};

type PayPalOrder = {
  id: string;
  status: string;
};

export async function POST(req: NextRequest) {
  if (!isPayPalConfigured()) return NextResponse.json({ error: "PayPal no está disponible." }, { status: 503 });
  if (process.env.NODE_ENV === "production" && getPayPalEnvironment() !== "live") {
    return NextResponse.json({ error: "PayPal todavía no está activo para pagos reales." }, { status: 503 });
  }
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Solicitud de compra no válida." }, { status: 400 });
    const db = getAdminDb();
    const [item] = await db.select<CatalogItem>("catalog_items", {
      select: "id,title,price,currency",
      id: `eq.${parsed.data.catalog_item_id}`,
      status: "eq.published",
      limit: "1",
    });
    if (!item || item.price == null || Number(item.price) <= 0) {
      return NextResponse.json({ error: "Producto no disponible." }, { status: 404 });
    }

    const total = (Number(item.price) * parsed.data.quantity).toFixed(2);
    const [order] = await db.insert<{ id: string }>("customer_orders", {
      customer_email: parsed.data.customer_email || "pendiente@checkout.affilix.es",
      status: "pending",
      currency: item.currency || "EUR",
      subtotal: Number(total),
      total: Number(total),
      payment_provider: "paypal",
      metadata: { source: "paypal_checkout" },
    });
    if (!order) throw new Error("No se pudo crear el pedido.");
    await db.insert("order_items", {
      order_id: order.id,
      catalog_item_id: item.id,
      title: item.title,
      quantity: parsed.data.quantity,
      unit_price: Number(item.price),
      total: Number(total),
    });

    const paypalOrder = await paypalRequest<PayPalOrder>("/v2/checkout/orders", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          custom_id: order.id,
          description: item.title.slice(0, 127),
          amount: { currency_code: (item.currency || "EUR").toUpperCase(), value: total },
        }],
      }),
    });
    await db.update("customer_orders", { id: order.id }, { payment_reference: paypalOrder.id });
    return NextResponse.json({ id: paypalOrder.id });
  } catch (error) {
    console.error("[PayPal create-order]", { message: error instanceof Error ? error.message : "Error desconocido" });
    return NextResponse.json({ error: "No se pudo iniciar PayPal." }, { status: 500 });
  }
}

