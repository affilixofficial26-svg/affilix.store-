import { NextRequest, NextResponse } from "next/server";
import { TOP_NICHES } from "@/lib/niches";

export async function POST(req: NextRequest) {
  const { niche } = await req.json();
  if (!niche) return NextResponse.json({ error: "niche es obligatorio" }, { status: 400 });
  const match = TOP_NICHES.find((item) => item.name.toLowerCase().includes(String(niche).toLowerCase())) || TOP_NICHES[0];
  return NextResponse.json({ niche: match, rules: "Amazon: precio 25-100, rating 4.2+, reviews 500+. ClickBank: gravity 20+, comisión 50%+." });
}
