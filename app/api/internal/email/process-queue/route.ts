import { NextRequest, NextResponse } from "next/server";
import { requireInternal } from "@/lib/server-auth";
import { writeCronLog } from "@/lib/internal-jobs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await requireInternal(req);
  if (denied) return denied;

  const started = Date.now();
  try {
    await writeCronLog("email_process_queue", "completed", started, { processed: 0 });
    return NextResponse.json({ ok: true, processed: 0 });
  } catch (error) {
    await writeCronLog("email_process_queue", "failed", started, {}, error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 });
  }
}

export const GET = POST;
