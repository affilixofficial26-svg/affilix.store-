import { NextRequest, NextResponse } from "next/server";
import { AmazonApi } from "@/lib/amazon-api";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { accessKey, secretKey, associateTag, keywords, category, minPrice, maxPrice } = body;
  if (!accessKey || !secretKey || !associateTag || !keywords) return NextResponse.json({ error: "accessKey, secretKey, associateTag y keywords son obligatorios" }, { status: 400 });
  const products = await new AmazonApi({ accessKey, secretKey, associateTag }).searchItems(keywords, category, minPrice, maxPrice);
  return NextResponse.json({ products });
}
