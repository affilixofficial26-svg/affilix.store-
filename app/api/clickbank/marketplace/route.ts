import { NextRequest, NextResponse } from "next/server";
import { ClickBankApi } from "@/lib/clickbank-api";

export async function POST(req: NextRequest) {
  const { apiKey, accountNickname, keywords } = await req.json();
  if (!apiKey || !accountNickname) return NextResponse.json({ error: "apiKey y accountNickname son obligatorios" }, { status: 400 });
  const products = await new ClickBankApi({ apiKey, accountNickname }).marketplace(keywords);
  return NextResponse.json({ products });
}
