import { NextRequest, NextResponse } from "next/server";
import { requireCron } from "@/lib/server-auth";
import { getBalance } from "@/lib/muapi/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = requireCron(req);
  if (denied) return denied;

  const balance = await getBalance();
  const threshold = Number(process.env.MUAPI_LOW_BALANCE_THRESHOLD_USD || 20);
  return NextResponse.json({
    ok: true,
    balance_usd: balance.balance_usd,
    alert: balance.balance_usd < threshold,
    threshold_usd: threshold,
  });
}

export const GET = POST;
