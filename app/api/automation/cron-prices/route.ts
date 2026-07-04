import { NextRequest, NextResponse } from "next/server";
import { refreshOfferSelection } from "@/lib/product-automation";

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const result = await refreshOfferSelection(120);
  return NextResponse.json({ ok: true, ...result });
}
