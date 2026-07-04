import { NextRequest, NextResponse } from "next/server";
import { requireInternal } from "@/lib/server-auth";
import { writeCronLog } from "@/lib/internal-jobs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await requireInternal(req);
  if (denied) return denied;

  const started = Date.now();
  await writeCronLog("service_runs_process", "completed", started, { processed: 0 });
  return NextResponse.json({ ok: true, processed: 0 });
}

export const GET = POST;
