import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { completePaidOrder } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";
import { requiredEnv } from "@/lib/utils";

async function completeCheckout(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) throw new Error("El evento no contiene order_id.");
  if (session.payment_status !== "paid") throw new Error("Stripe no confirmó el pago.");
  await completePaidOrder({
    orderId,
    provider: "stripe",
    providerEventId: `stripe:checkout:${session.id}`,
    amountCents: session.amount_total || 0,
    currency: session.currency || "eur",
    customerEmail: session.customer_details?.email || session.customer_email,
    metadata: {
      stripe_checkout_session: session.id,
      stripe_payment_intent: session.payment_intent,
      payment_status: session.payment_status,
    },
  });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Firma ausente." }, { status: 400 });
  try {
    const event = getStripe().webhooks.constructEvent(await request.text(), signature, requiredEnv("STRIPE_WEBHOOK_SECRET"));
    if (event.type === "checkout.session.completed") await completeCheckout(event.data.object);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe webhook] Evento rechazado", { message: error instanceof Error ? error.message : "Error desconocido" });
    return NextResponse.json({ error: "Webhook no válido." }, { status: 400 });
  }
}
