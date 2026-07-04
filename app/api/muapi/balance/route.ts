import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { getBalance } from "@/lib/muapi/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    return NextResponse.json(await getBalance());
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer balance MuAPI.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
