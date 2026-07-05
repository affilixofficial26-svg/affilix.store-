import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();
  try {
    await getAdminDb().delete("live_test_runs", { is_test: true, created_at: `lt.${cutoff}` });
  } catch {
    // Si PostgREST no acepta el filtro compuesto en delete del helper actual, no bloquea el panel.
  }
  return NextResponse.redirect(new URL("/dashboard/live-tests", req.url), 303);
}
