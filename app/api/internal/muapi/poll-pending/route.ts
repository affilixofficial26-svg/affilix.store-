import { NextRequest, NextResponse } from "next/server";
import { requireInternal } from "@/lib/server-auth";
import { pollPending } from "@/lib/muapi/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await requireInternal(req);
  if (denied) return denied;

  const started = Date.now();
  try {
    const results = await pollPending(10);
    return NextResponse.json({ ok: true, duration_ms: Date.now() - started, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo ejecutar polling MuAPI.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = POST;
