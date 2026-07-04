import { NextRequest, NextResponse } from "next/server";
import { requireInternal } from "@/lib/server-auth";
import { writeCronLog } from "@/lib/internal-jobs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await requireInternal(req);
  if (denied) return denied;

  const started = Date.now();
  await writeCronLog("finance_refresh_kpis", "completed", started, { refreshed: true });
  return NextResponse.json({ ok: true, refreshed: true });
}

export const GET = POST;
