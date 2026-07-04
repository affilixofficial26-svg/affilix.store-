import { NextRequest, NextResponse } from "next/server";
import { ClickBankApi } from "@/lib/clickbank-api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const { apiKey, accountNickname } = await req.json();
  const product = await new ClickBankApi({ apiKey, accountNickname }).product(sku);
  return NextResponse.json({ product });
}
