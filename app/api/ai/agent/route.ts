import { NextRequest, NextResponse } from "next/server";
import { getLocalAiConfig } from "@/lib/local-ai-config";
import { generateMarketingContent } from "@/lib/marketing/ai-content";
import { refreshOfferSelection, saveDiscoveredProducts as saveProfitableProducts } from "@/lib/product-automation";
import { discoverProducts } from "@/lib/product-discovery";
import { fillMissingProductImages } from "@/lib/product-images";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct, ExternalProduct, Platform } from "@/types";

type AgentProductResult = {
  id: string;
  title: string;
  platform: Platform;
  category: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
  slug: string;
  is_active: boolean;
  is_featured: boolean;
  auto_published: boolean;
};

type PlatformAccountStatus = {
  platform: Platform;
  connected: boolean;
  last_test_status: "success" | "error" | null;
};

const validActions = ["run_full_cycle", "discover_products", "update_prices", "generate_content", "generate_images"];
const actionLabels: Record<string, string> = {
  run_full_cycle: "ciclo completo",
  discover_products: "descubrimiento de productos",
  update_prices: "revision de precios",
  generate_content: "generacion de contenido",
  generate_images: "generacion de imagenes",
};

function normalizeAction(value: unknown, message: string) {
  const action = String(value || "").trim();
  if (validActions.includes(action)) return action;
  const text = message.toLowerCase();
  if (text.includes("producto") || text.includes("buscar") || text.includes("descubrir")) return "discover_products";
  if (text.includes("precio")) return "update_prices";
  if (text.includes("contenido") || text.includes("texto") || text.includes("seo")) return "generate_content";
  if (text.includes("imagen") || text.includes("foto")) return "generate_images";
  return "run_full_cycle";
}

async function saveDiscoveredProducts(products: ExternalProduct[]) {
  return saveProfitableProducts(products);
}

async function getActiveProducts(limit: number) {
  return getAdminDb().select<AffiliateProduct>("affiliate_products", {
    select: "*",
    is_active: "eq.true",
    order: "updated_at.desc",
    limit: String(limit),
  });
}

function summarizeProduct(product: AffiliateProduct): AgentProductResult {
  return {
    id: product.id,
    title: product.ai_title || product.title,
    platform: product.platform,
    category: product.category,
    price: product.price,
    currency: product.currency,
    image_url: product.image_url,
    slug: product.slug,
    is_active: product.is_active,
    is_featured: product.is_featured,
    auto_published: product.auto_published,
  };
}

async function getProductsByIds(ids: string[]) {
  const cleanIds = Array.from(new Set(ids.filter(Boolean)));
  if (!cleanIds.length) return [];
  return getAdminDb().select<AffiliateProduct>("affiliate_products", {
    select: "*",
    id: `in.(${cleanIds.join(",")})`,
    limit: String(cleanIds.length),
  });
}

async function safeSelect<T>(table: string, query: Record<string, string>) {
  try {
    return await getAdminDb().select<T>(table, query);
  } catch {
    return [];
  }
}

export async function GET() {
  const [providers, products, localAiConfig] = await Promise.all([
    safeSelect<PlatformAccountStatus>("platform_accounts", {
      select: "platform,connected,last_test_status",
      connected: "eq.true",
      limit: "40",
    }),
    safeSelect<AffiliateProduct>("affiliate_products", {
      select: "*",
      is_active: "eq.true",
      order: "updated_at.desc",
      limit: "12",
    }),
    getLocalAiConfig(),
  ]);

  return NextResponse.json({
    providers,
    products: products.map(summarizeProduct),
    ai: {
      text_provider: localAiConfig.ai_provider || null,
      text_model: localAiConfig.ai_model || null,
      image_provider: localAiConfig.image_provider || null,
      image_model: localAiConfig.image_model || null,
      has_text_key: Boolean(localAiConfig.ai_api_key || process.env.OPENAI_API_KEY),
      has_image_key: Boolean(localAiConfig.image_api_key || localAiConfig.ai_api_key || process.env.OPENAI_API_KEY),
    },
  });
}

async function runDiscoverProducts(body: Record<string, unknown>) {
  const keywords = String(body.keywords || body.message || "hogar cocina mascotas fitness software").trim();
  const platform = String(body.platform || "all") as Platform | "all";
  const result = await discoverProducts(keywords, platform);
  const saved = await saveDiscoveredProducts(result.products);
  return {
    title: "Productos revisados",
    detail: `El agente encontro ${result.products.length} oportunidades y dejo ${saved.length} productos guardados o actualizados.`,
    keywords,
    saved: saved.length,
    errors: result.errors,
    products: saved.map(summarizeProduct),
  };
}

async function runGenerateContent(limit: number) {
  const products = await getActiveProducts(limit);
  const results = [];
  for (const product of products) {
    try {
      const content = await generateMarketingContent(product);
      results.push({ product_id: product.id, title: product.title, ok: true, status: content?.content_status || "ready" });
    } catch (error) {
      results.push({ product_id: product.id, title: product.title, ok: false, error: error instanceof Error ? error.message : "No se pudo generar contenido" });
    }
  }
  return {
    title: "Contenido revisado",
    detail: `El agente proceso ${results.length} productos para textos, anuncios y SEO.`,
    results,
    products: products.map(summarizeProduct),
  };
}

async function runUpdatePrices(limit: number) {
  const result = await refreshOfferSelection(limit);
  const featuredProducts = await getProductsByIds(result.featured);
  return {
    title: "Precios revisados",
    detail: `El agente reviso ${result.checked} productos y actualizo la seleccion de ofertas destacadas.`,
    checked: result.checked,
    discounted: result.discounted,
    products: featuredProducts.map(summarizeProduct),
  };
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  const contentType = req.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  try {
    const body = isJson ? await req.json() : Object.fromEntries((await req.formData()).entries());
    const message = String(body.message || "").trim();
    const action = normalizeAction(body.action, message);
    const limit = Math.max(1, Math.min(24, Number(body.limit || 10)));
    const userId = body.user_id ? String(body.user_id) : null;
    const db = getAdminDb();

    await db.insert("agent_logs", { user_id: userId, action, details: { source: "manual", message }, status: "running" });

    const steps: unknown[] = [];
    if (action === "run_full_cycle" || action === "discover_products") {
      steps.push(await runDiscoverProducts(body));
    }
    if (action === "run_full_cycle" || action === "update_prices") {
      steps.push(await runUpdatePrices(limit));
    }
    if (action === "run_full_cycle" || action === "generate_content") {
      steps.push(await runGenerateContent(limit));
    }
    if (action === "run_full_cycle" || action === "generate_images") {
      const images = await fillMissingProductImages(userId, limit);
      const products = await getProductsByIds(images.map((item) => item.product_id));
      steps.push({
        title: "Imagenes revisadas",
        detail: `El agente intento completar imagenes en ${images.length} productos sin foto.`,
        results: images,
        products: products.map(summarizeProduct),
      });
    }

    const durationMs = Date.now() - started;
    await db.insert("notifications", {
      user_id: userId,
      type: "system",
      title: "Agente ejecutado",
      message: `Accion completada: ${actionLabels[action]}.`,
    });
    await db.insert("agent_logs", {
      user_id: userId,
      action,
      details: { duration_ms: durationMs, steps },
      status: "success",
      duration_ms: durationMs,
    });

    const response = {
      ok: true,
      action,
      title: "Agente terminado",
      message: `AFFILIX ejecuto ${actionLabels[action]} correctamente.`,
      duration_ms: durationMs,
      steps,
    };
    if (!isJson) {
      const url = new URL("/dashboard/ai-agent", req.url);
      url.searchParams.set("agent", "ok");
      url.searchParams.set("action", action);
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido del agente";
    try {
      await getAdminDb().insert("agent_logs", {
        user_id: null,
        action: "agent_error",
        details: { error: message },
        status: "error",
        duration_ms: Date.now() - started,
      });
    } catch {
      // Si Supabase falla, devolvemos el error original al panel.
    }
    if (!isJson) {
      const url = new URL("/dashboard/ai-agent", req.url);
      url.searchParams.set("agent", "error");
      url.searchParams.set("message", message);
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({
      ok: false,
      error: "El agente no pudo completar la orden.",
      detail: message,
    }, { status: 500 });
  }
}
