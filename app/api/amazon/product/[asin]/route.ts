import { NextRequest, NextResponse } from "next/server";
import { AmazonApi } from "@/lib/amazon-api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ asin: string }> }) {
  const { asin } = await params;
  const body = await req.json();
  const products = await new AmazonApi(body).getItems([asin]);
  return NextResponse.json({ product: products[0] });
}
