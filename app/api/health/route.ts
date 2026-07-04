import { NextResponse } from "next/server";
import { checkSupabaseHealth } from "@/lib/supabase-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkSupabaseHealth();
  return NextResponse.json(
    {
      ready: database.ready,
      service: "AFFILIX",
      timestamp: new Date().toISOString(),
      checks: { database },
      errors: database.errors,
    },
    { status: database.ready ? 200 : 503 },
  );
}
