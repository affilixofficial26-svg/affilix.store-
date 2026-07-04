import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";
import { sendTelegramAlert, verifyWebhookSignature } from "@/lib/security";
import { notifyOwnerSale } from "@/lib/system-email";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifyWebhookSignature(rawBody, req.headers.get("x-clickbank-signature") || req.headers.get("x-affilix-signature") || req.headers.get("x-webhook-signature"))) {
    await sendTelegramAlert("AFFILIX alerta: webhook ClickBank rechazado por firma invalida.");
    return NextResponse.json({ error: "Firma invalida" }, { status: 401 });
  }
  const body = JSON.parse(rawBody);
  await getAdminDb().insert("commissions", { ...body, platform: "clickbank", status: body.status || "pending" });
  await notifyOwnerSale({
    source: "webhook:clickbank",
    productTitle: body.product_title || body.title || body.item || null,
    orderId: body.order_id || body.receipt || null,
    customerEmail: body.customer_email || body.email || null,
    customerName: body.customer_name || body.name || null,
    grossSaleAmount: body.sale_amount || body.gross_sale_amount || null,
    totalCommissionAmount: body.commission_amount || body.commission || null,
    ownerCommissionAmount: body.commission_amount || body.commission || null,
    status: body.status || "pending",
  });
  return NextResponse.json({ ok: true });
}
