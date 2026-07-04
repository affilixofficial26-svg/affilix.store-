import { NextRequest, NextResponse } from "next/server";
import { CjAffiliateApi } from "@/lib/cj-affiliate-api";

export async function POST(req: NextRequest) {
  const { apiKey, websiteId, keywords } = await req.json();
  if (!apiKey || !websiteId || !keywords) return NextResponse.json({ error: "apiKey, websiteId y keywords son obligatorios" }, { status: 400 });
  const products = await new CjAffiliateApi({ apiKey, websiteId }).products(keywords);
  return NextResponse.json({ products });
}
