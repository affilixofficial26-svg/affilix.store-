import { getAdminDb } from "@/lib/supabase";

export async function completePaidOrder(params: {
  orderId: string;
  provider: "stripe" | "paypal";
  providerEventId: string;
  amountCents: number;
  currency: string;
  customerEmail?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const db = getAdminDb();
  const existing = await db.select<{ id: string }>("finance_events", {
    select: "id",
    provider_event_id: `eq.${params.providerEventId}`,
    limit: "1",
  });
  if (existing.length) return { duplicate: true };

  const orders = await db.select<{ id: string; total: number | string; currency: string; status: string }>("customer_orders", {
    select: "id,total,currency,status",
    id: `eq.${params.orderId}`,
    limit: "1",
  });
  const order = orders[0];
  if (!order) throw new Error("Pedido no encontrado.");
  const expectedCents = Math.round(Number(order.total) * 100);
  if (params.amountCents !== expectedCents || params.currency.toUpperCase() !== order.currency.toUpperCase()) {
    throw new Error("El importe confirmado no coincide con el pedido.");
  }

  await db.update("customer_orders", { id: order.id }, {
    status: "paid",
    customer_email: params.customerEmail || undefined,
    metadata: {
      payment_provider: params.provider,
      ...params.metadata,
    },
  });
  await db.insert("finance_events", {
    type: "sale",
    order_id: order.id,
    amount_cents: params.amountCents,
    currency: params.currency.toUpperCase(),
    provider: params.provider,
    provider_event_id: params.providerEventId,
    metadata: params.metadata || {},
  });
  return { duplicate: false };
}

