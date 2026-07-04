import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";
import { notifyOwnerSale } from "@/lib/system-email";

type CommissionRow = {
  id: string;
  platform: string;
  order_id: string | null;
  commission_amount: number | string | null;
  sale_amount: number | string | null;
  status: string;
  earned_at: string;
};

export async function GET(req: NextRequest) {
  const rows = await getAdminDb().select<CommissionRow>("commissions", { select: "*", order: "earned_at.desc" });
  if (req.nextUrl.searchParams.get("format") === "csv") {
    const csv = ["platform,order_id,commission_amount,sale_amount,status,earned_at", ...rows.map((r) => [r.platform, r.order_id, r.commission_amount, r.sale_amount, r.status, r.earned_at].join(","))].join("\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=commissions.csv" } });
  }
  return NextResponse.json({ commissions: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.user_id || !body.platform || !body.commission_amount) return NextResponse.json({ error: "user_id, platform y commission_amount son obligatorios" }, { status: 400 });
  const rows = await getAdminDb().insert("commissions", body);
  await notifyOwnerSale({
    source: `commission:${body.platform}`,
    productTitle: body.product_title || body.title || null,
    orderId: body.order_id || null,
    customerEmail: body.customer_email || null,
    customerName: body.customer_name || null,
    grossSaleAmount: body.sale_amount || null,
    totalCommissionAmount: body.commission_amount,
    ownerCommissionAmount: body.commission_amount,
    status: body.status || "pending",
  });
  return NextResponse.json({ commission: rows[0] });
}
