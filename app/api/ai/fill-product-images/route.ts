import { NextRequest, NextResponse } from "next/server";
import { fillMissingProductImages } from "@/lib/product-images";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const limit = Math.min(Number(body.limit || 10), 30);

  try {
    const results = await fillMissingProductImages(body.user_id ? String(body.user_id) : null, limit);
    if (!contentType.includes("application/json")) {
      const failed = results.filter((item) => !item.ok).length;
      const url = new URL("/dashboard/products", req.url);
      url.searchParams.set("images", failed ? "partial" : "ok");
      url.searchParams.set("processed", String(results.length));
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (error) {
    if (!contentType.includes("application/json")) {
      const url = new URL("/dashboard/products", req.url);
      url.searchParams.set("images", "error");
      url.searchParams.set("message", error instanceof Error ? error.message.slice(0, 160) : "No se pudieron completar las fotos");
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudieron completar las fotos" }, { status: 500 });
  }
}
