import { NextRequest, NextResponse } from "next/server";
import { getLocalAiConfig } from "@/lib/local-ai-config";
import { generateText, productContentPrompt } from "@/lib/openai-client";
import { ensureProductImage } from "@/lib/product-images";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct, AiProvider, UserProfile } from "@/types";

async function resolveAiConfig(product: AffiliateProduct) {
  if (product.user_id) {
    const profile = (await getAdminDb().select<UserProfile>("user_profiles", { select: "*", id: `eq.${product.user_id}`, limit: "1" }))[0];
    if (profile?.ai_provider) {
      return {
        provider: profile.ai_provider,
        apiKey: profile.ai_api_key,
        model: profile.ai_model,
        ollamaBaseUrl: profile.ollama_base_url,
      };
    }
  }

  const localConfig = await getLocalAiConfig();
  return {
    provider: (localConfig.ai_provider || "ollama") as AiProvider,
    apiKey: localConfig.ai_api_key || process.env.MUAPI_API_KEY || null,
    model: localConfig.ai_model || "qwen2.5:7b",
    ollamaBaseUrl: localConfig.ollama_base_url || "http://localhost:11434",
  };
}

function redirectBack(req: NextRequest, state: "ok" | "error", message?: string) {
  const url = new URL(req.headers.get("referer") || "/dashboard/products", req.url);
  url.searchParams.set("content", state);
  if (message) url.searchParams.set("message", message);
  return NextResponse.redirect(url, 303);
}

function parseJson(raw: string) {
  const clean = raw.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("La IA no devolvio JSON valido");
  return JSON.parse(clean.slice(start, end + 1)) as Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const productId = body.product_id || body.productId;
  if (!productId) {
    if (!isJson) return redirectBack(req, "error", "product_id es obligatorio");
    return NextResponse.json({ error: "product_id es obligatorio" }, { status: 400 });
  }

  const db = getAdminDb();
  const product = (await db.select<AffiliateProduct>("affiliate_products", { select: "*", id: `eq.${productId}`, limit: "1" }))[0];
  if (!product) {
    if (!isJson) return redirectBack(req, "error", "Producto no encontrado");
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  try {
    const aiConfig = await resolveAiConfig(product);
    const raw = await generateText(aiConfig, productContentPrompt(product));
    const parsed = parseJson(raw);

    await db.update("affiliate_products", { id: product.id }, parsed);
    await db.insert("ai_generated_content", {
      user_id: product.user_id,
      product_id: product.id,
      content_type: "review",
      prompt_used: "productContentPrompt",
      content: raw,
      model: aiConfig.model || aiConfig.provider,
    });

    let imageResult: unknown = null;
    let imageError: string | null = null;
    try {
      imageResult = await ensureProductImage({ ...product, ...parsed } as AffiliateProduct, Boolean(body.force_image));
    } catch (error) {
      imageError = error instanceof Error ? error.message : "No se pudo generar la imagen";
    }

    if (!isJson) return redirectBack(req, imageError ? "error" : "ok", imageError || undefined);
    return NextResponse.json({ content: parsed, image: imageResult, image_error: imageError });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar contenido";
    if (!isJson) return redirectBack(req, "error", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
