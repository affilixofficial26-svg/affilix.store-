import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";
import { sendTelegramAlert, verifyWebhookSignature } from "@/lib/security";
import { notifyOwnerSale } from "@/lib/system-email";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifyWebhookSignature(rawBody, req.headers.get("x-amz-sns-message-signature") || req.headers.get("x-affilix-signature") || req.headers.get("x-webhook-signature"))) {
    await sendTelegramAlert("AFFILIX alerta: webhook Amazon rechazado por firma invalida.");
    return NextResponse.json({ error: "Firma invalida" }, { status: 401 });
  }
  const body = JSON.parse(rawBody);
  await getAdminDb().insert("commissions", { ...body, platform: "amazon", status: body.status || "pending" });
  await notifyOwnerSale({
    source: "webhook:amazon",
    productTitle: body.product_title || body.title || body.asin || null,
    orderId: body.order_id || null,
    customerEmail: body.customer_email || null,
    customerName: body.customer_name || null,
    grossSaleAmount: body.sale_amount || body.gross_sale_amount || null,
    totalCommissionAmount: body.commission_amount || body.commission || null,
    ownerCommissionAmount: body.commission_amount || body.commission || null,
    status: body.status || "pending",
  });
  return NextResponse.json({ ok: true });
}
