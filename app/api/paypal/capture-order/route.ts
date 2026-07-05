import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPayPalEnvironment, isPayPalConfigured, paypalRequest } from "@/lib/paypal";
import { completePaidOrder } from "@/lib/payments";
import { getAdminDb } from "@/lib/supabase";

const schema = z.object({ paypal_order_id: z.string().min(8).max(128) });

type PayPalCapture = {
  id: string;
  status: string;
  payer?: { email_address?: string };
  purchase_units?: Array<{
    custom_id?: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
};

export async function POST(req: NextRequest) {
  if (!isPayPalConfigured()) return NextResponse.json({ error: "PayPal no está disponible." }, { status: 503 });
  if (process.env.NODE_ENV === "production" && getPayPalEnvironment() !== "live") {
    return NextResponse.json({ error: "PayPal todavía no está activo para pagos reales." }, { status: 503 });
  }
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Pedido PayPal no válido." }, { status: 400 });
    const orders = await getAdminDb().select<{ id: string }>("customer_orders", {
      select: "id",
      payment_reference: `eq.${parsed.data.paypal_order_id}`,
      payment_provider: "eq.paypal",
      limit: "1",
    });
    if (!orders[0]) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });

    const capture = await paypalRequest<PayPalCapture>(`/v2/checkout/orders/${encodeURIComponent(parsed.data.paypal_order_id)}/capture`, {
      method: "POST",
      body: "{}",
    });
    const payment = capture.purchase_units?.[0]?.payments?.captures?.[0];
    if (capture.status !== "COMPLETED" || !payment || payment.status !== "COMPLETED") {
      return NextResponse.json({ error: "PayPal no confirmó el pago." }, { status: 409 });
    }
    await completePaidOrder({
      orderId: orders[0].id,
      provider: "paypal",
      providerEventId: `paypal:capture:${payment.id}`,
      amountCents: Math.round(Number(payment.amount.value) * 100),
      currency: payment.amount.currency_code,
      customerEmail: capture.payer?.email_address,
      metadata: { paypal_order_id: capture.id, paypal_capture_id: payment.id },
    });
    return NextResponse.json({ ok: true, order_id: orders[0].id });
  } catch (error) {
    console.error("[PayPal capture-order]", { message: error instanceof Error ? error.message : "Error desconocido" });
    return NextResponse.json({ error: "No se pudo confirmar el pago PayPal." }, { status: 500 });
  }
}

