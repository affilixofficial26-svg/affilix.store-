import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });
  await getAdminDb().delete("platform_accounts", { id });
  return NextResponse.json({ ok: true });
}
