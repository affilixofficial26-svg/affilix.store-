import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCron } from "@/lib/server-auth";
import { syncModelCatalog } from "@/lib/muapi/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = requireAdminOrCron(req);
  if (denied) return denied;

  try {
    return NextResponse.json({ ok: true, ...(await syncModelCatalog()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo sincronizar catalogo MuAPI.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = POST;
