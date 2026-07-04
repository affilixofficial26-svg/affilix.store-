import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { getJob, pollJob } from "@/lib/muapi/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { id } = await context.params;
  const job = await getJob(id);
  if (!job) return NextResponse.json({ error: "Job no encontrado." }, { status: 404 });
  return NextResponse.json({ job });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { id } = await context.params;
  try {
    return NextResponse.json(await pollJob(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo consultar MuAPI.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
