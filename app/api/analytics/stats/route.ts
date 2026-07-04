import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";

type ProductIdRow = { id: string };
type ClickRow = { id: string; converted: boolean | null };
type CommissionStatRow = { commission_amount: number | string | null; status: string };

export async function GET() {
  try {
    const db = getAdminDb();
    const [products, clicks, commissions] = await Promise.all([
      db.select<ProductIdRow>("affiliate_products", { select: "id", is_active: "eq.true" }),
      db.select<ClickRow>("click_events", { select: "id,converted" }),
      db.select<CommissionStatRow>("commissions", { select: "commission_amount,status" }),
    ]);
    return NextResponse.json({
      activeProducts: products.length,
      clicks: clicks.length,
      conversions: clicks.filter((item) => item.converted).length,
      approvedCommissions: commissions.filter((item) => item.status === "approved").reduce((sum, item) => sum + Number(item.commission_amount || 0), 0),
    });
  } catch {
    return NextResponse.json({
      activeProducts: 0,
      clicks: 0,
      conversions: 0,
      approvedCommissions: 0,
      warning: "Supabase no esta configurado o no responde. Mostrando metricas locales en cero.",
    });
  }
}
