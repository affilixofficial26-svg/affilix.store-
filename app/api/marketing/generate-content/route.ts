import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateMarketingContent } from "@/lib/marketing/ai-content";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct } from "@/types";

const schema = z.object({ productId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const isJson = req.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    if (!isJson) return NextResponse.redirect(new URL("/dashboard/marketing?content=error&message=Producto%20invalido", req.url), 303);
    return NextResponse.json({ error: "Producto invalido" }, { status: 400 });
  }
  try {
    const product = (await getAdminDb().select<AffiliateProduct>("affiliate_products", { select: "*", id: `eq.${parsed.data.productId}`, limit: "1" }))[0];
    if (!product) throw new Error("Producto no encontrado");
    const content = await generateMarketingContent(product);
    if (isJson) return NextResponse.json({ content });
    return NextResponse.redirect(new URL("/dashboard/marketing?content=ok", req.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar contenido de marketing";
    if (!isJson) {
      const url = new URL("/dashboard/marketing", req.url);
      url.searchParams.set("content", "error");
      url.searchParams.set("message", message);
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
