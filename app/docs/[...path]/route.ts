import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const requested = normalize(join(process.cwd(), "docs", ...path));
  const docsRoot = normalize(join(process.cwd(), "docs"));
  if (!requested.startsWith(docsRoot) || !requested.endsWith(".md")) {
    return NextResponse.json({ error: "Documento no permitido." }, { status: 403 });
  }
  try {
    const content = await readFile(requested, "utf8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  }
}
