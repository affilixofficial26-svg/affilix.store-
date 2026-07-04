import { NextRequest, NextResponse } from "next/server";
import { discoverAndPublishProfitableProducts } from "@/lib/product-automation";

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const result = await discoverAndPublishProfitableProducts(req.nextUrl.searchParams.get("keywords") || undefined);
  return NextResponse.json({ ok: true, found: result.products.length, saved: result.saved.length, errors: result.errors });
}
