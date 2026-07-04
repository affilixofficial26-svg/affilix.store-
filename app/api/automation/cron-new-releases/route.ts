import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await getAdminDb().insert("agent_logs", { user_id: null, action: "cron-new-releases", details: {}, status: "success" });
  return NextResponse.json({ ok: true });
}
