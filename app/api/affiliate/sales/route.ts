import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";
import { notifyAdminAndAffiliate } from "@/lib/notifications";
import { notifyOwnerSale } from "@/lib/system-email";
import type { AffiliatePartnerProduct, AffiliatePartnerPublic } from "@/types";

function toMoneyNumber(value: unknown) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const partnerId = String(body.partner_id || "").trim();
  const productId = String(body.product_id || "").trim();
  const totalCommissionAmount = toMoneyNumber(body.total_commission_amount || body.commission_amount);
  const grossSaleAmount = body.gross_sale_amount !== undefined ? toMoneyNumber(body.gross_sale_amount) : null;

  if (!partnerId || !productId || totalCommissionAmount <= 0) {
    return NextResponse.json({ error: "partner_id, product_id y total_commission_amount son obligatorios" }, { status: 400 });
  }

  const db = getAdminDb();
  const [partner, product] = await Promise.all([
    db.select<AffiliatePartnerPublic>("affiliate_partners", {
      select: "id,email,full_name,brand_name,store_slug,website_url,payout_email,affiliate_commission_rate,owner_commission_rate,status,created_at",
      id: `eq.${partnerId}`,
      status: "eq.active",
      limit: "1",
    }),
    db.select<AffiliatePartnerProduct>("affiliate_partner_products", {
      select: "*",
      id: `eq.${productId}`,
      partner_id: `eq.${partnerId}`,
      limit: "1",
    }),
  ]);

  const affiliate = partner[0];
  const soldProduct = product[0];
  if (!affiliate || !soldProduct) return NextResponse.json({ error: "Afiliado o producto no encontrado" }, { status: 404 });

  const affiliateRate = Number(affiliate.affiliate_commission_rate || 0) / 100;
  const ownerRate = Number(affiliate.owner_commission_rate || 0) / 100;
  const affiliateCommissionAmount = Number((totalCommissionAmount * affiliateRate).toFixed(2));
  const ownerCommissionAmount = Number((totalCommissionAmount * ownerRate).toFixed(2));

  const rows = await db.insert("affiliate_partner_commissions", {
    partner_id: affiliate.id,
    product_id: soldProduct.id,
    order_id: String(body.order_id || "").trim() || null,
    gross_sale_amount: grossSaleAmount,
    total_commission_amount: totalCommissionAmount,
    affiliate_commission_amount: affiliateCommissionAmount,
    owner_commission_amount: ownerCommissionAmount,
    status: body.status || "pending",
  });

  await notifyOwnerSale({
    source: "affiliate_sale",
    affiliateName: affiliate.full_name,
    affiliateEmail: affiliate.email,
    productTitle: soldProduct.title,
    orderId: body.order_id || null,
    customerEmail: body.customer_email || null,
    customerName: body.customer_name || null,
    grossSaleAmount,
    totalCommissionAmount,
    affiliateCommissionAmount,
    ownerCommissionAmount,
    status: body.status || "pending",
  });

  await notifyAdminAndAffiliate(
    {
      type: "affiliate_sale",
      title: "Venta de afiliado registrada",
      message: `${affiliate.full_name} vendio ${soldProduct.title}. Comision afiliado: ${affiliateCommissionAmount}.`,
      actorType: "affiliate",
      actorId: affiliate.id,
      actorName: affiliate.full_name,
      data: { productId: soldProduct.id, productTitle: soldProduct.title, grossSaleAmount, totalCommissionAmount, affiliateCommissionAmount, ownerCommissionAmount },
    },
    {
      partnerId: affiliate.id,
      type: "sale",
      title: "Venta registrada",
      message: `Se registro una venta de ${soldProduct.title}. Tu comision: ${affiliateCommissionAmount}.`,
      data: { productId: soldProduct.id, productTitle: soldProduct.title, grossSaleAmount, affiliateCommissionAmount, status: body.status || "pending" },
    },
  );

  return NextResponse.json({ sale: rows[0] });
}
