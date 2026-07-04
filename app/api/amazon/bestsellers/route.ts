import { NextRequest, NextResponse } from "next/server";
import { AmazonApi } from "@/lib/amazon-api";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const products = await new AmazonApi(body).searchItems(body.category || "best sellers", "All", body.minPrice, body.maxPrice);
  return NextResponse.json({ products });
}
