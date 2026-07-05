import { NextRequest, NextResponse } from "next/server";
import { completePaidOrder } from "@/lib/payments";
import { paypalRequest } from "@/lib/paypal";
import { getAdminDb } from "@/lib/supabase";

type PayPalWebhook = {
  id: string;
  event_type: string;
  resource?: {
    id?: string;
    status?: string;
    amount?: { currency_code?: string; value?: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
};

export async function POST(req: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return NextResponse.json({ error: "Webhook no configurado." }, { status: 503 });
  const raw = await req.text();
  let event: PayPalWebhook;
  try {
    event = JSON.parse(raw) as PayPalWebhook;
  } catch {
    return NextResponse.json({ error: "JSON no válido." }, { status: 400 });
  }

  try {
    const verification = await paypalRequest<{ verification_status: string }>("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: JSON.stringify({
        auth_algo: req.headers.get("paypal-auth-algo"),
        cert_url: req.headers.get("paypal-cert-url"),
        transmission_id: req.headers.get("paypal-transmission-id"),
        transmission_sig: req.headers.get("paypal-transmission-sig"),
        transmission_time: req.headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: event,
      }),
    });
    if (verification.verification_status !== "SUCCESS") {
      return NextResponse.json({ error: "Firma no válida." }, { status: 400 });
    }

    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED" && event.resource?.id) {
      const paypalOrderId = event.resource.supplementary_data?.related_ids?.order_id;
      if (!paypalOrderId) throw new Error("El webhook no contiene order_id de PayPal.");
      const [order] = await getAdminDb().select<{ id: string }>("customer_orders", {
        select: "id",
        payment_reference: `eq.${paypalOrderId}`,
        payment_provider: "eq.paypal",
        limit: "1",
      });
      if (!order) throw new Error("Pedido PayPal no encontrado.");
      await completePaidOrder({
        orderId: order.id,
        provider: "paypal",
        providerEventId: `paypal:event:${event.id}`,
        amountCents: Math.round(Number(event.resource.amount?.value || 0) * 100),
        currency: event.resource.amount?.currency_code || "EUR",
        metadata: { paypal_order_id: paypalOrderId, paypal_capture_id: event.resource.id },
      });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PayPal webhook]", { message: error instanceof Error ? error.message : "Error desconocido" });
    return NextResponse.json({ error: "Webhook rechazado." }, { status: 400 });
  }
}
