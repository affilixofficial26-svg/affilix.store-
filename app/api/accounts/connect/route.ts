import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveLocalAiConfig } from "@/lib/local-ai-config";
import { saveLocalPlatformAccount } from "@/lib/local-platform-accounts";
import { encryptSecret, safeTextSchema } from "@/lib/security";
import { SETUP_PLATFORMS } from "@/lib/setup-data";
import { getAdminDb } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

const platformAccountSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  platform: z.enum(["amazon", "amazon_seller", "ebay", "rakuten", "clickbank", "hotmart", "gumroad", "payhip", "warriorplus", "systeme", "digistore", "jvzoo", "cj", "shareasale", "impact", "awin", "spocket", "cjdrop", "walmart", "temu", "shein", "flexoffers", "partnerstack", "fiverr", "semrush", "hubspot", "booking", "agoda", "coinbase", "binance", "aliexpress", "teachable", "shopify", "etsy"]),
  primary_key: z.string().max(4000).optional(),
  secondary_key: z.string().max(4000).optional(),
  signup_url: z.string().trim().url().optional(),
  connect_mode: z.enum(["external_login", "manual_credentials"]).optional(),
});

const aiConfigSchema = z.object({
  store_name: safeTextSchema.optional(),
  currency: z.string().trim().min(3).max(3).optional(),
  ai_provider: z.enum(["openai", "anthropic", "groq", "mistral", "ollama"]).optional(),
  ai_model: z.string().trim().max(120).optional(),
  ai_api_key: z.string().trim().max(4000).optional(),
  ollama_base_url: z.string().trim().url().optional().or(z.literal("")),
  open_webui_url: z.string().trim().url().optional().or(z.literal("")),
  open_webui_api_key: z.string().trim().max(4000).optional(),
  perplexica_url: z.string().trim().url().optional().or(z.literal("")),
  n8n_url: z.string().trim().url().optional().or(z.literal("")),
  image_provider: z.enum(["openai", "custom"]).optional(),
  image_model: z.string().trim().max(120).optional(),
  image_api_key: z.string().trim().max(4000).optional(),
  image_base_url: z.string().trim().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
  if (data.platform) {
    const parsed = platformAccountSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: "Datos de cuenta invalidos" }, { status: 400 });
    const officialPlatform = SETUP_PLATFORMS.find((platform) => platform.id === parsed.data.platform);
    const officialSignupUrl = officialPlatform?.signupUrl || parsed.data.signup_url;
    const connectionMethod = parsed.data.connect_mode || "manual_credentials";
    const connected = false;
    const lastTestStatus = null;
    const lastTestMessage = connectionMethod === "external_login"
      ? `Registro abierto en la web oficial${officialPlatform ? ` de ${officialPlatform.name}` : ""}. Cuando termines, vuelve a AFFILIX, guarda la API o credenciales oficiales y pulsa Probar conexion.`
      : "Credenciales guardadas. Pulsa Probar conexion para confirmar que el proveedor responde y queda listo para importar productos.";
    const localAccount = {
      platform: parsed.data.platform,
      connected,
      connection_method: connectionMethod,
      signup_url: officialSignupUrl,
      credentials: {
        primary_key: parsed.data.primary_key || "",
        secondary_key: parsed.data.secondary_key || "",
      },
      last_test_status: lastTestStatus,
      last_test_message: lastTestMessage,
    } as const;

    const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    const canEncrypt = Boolean(process.env.ENCRYPTION_KEY);
    if (hasSupabase && canEncrypt) {
      const payload = {
        user_id: parsed.data.user_id || null,
        platform: parsed.data.platform,
        credentials: {
          primary_key: encryptSecret(parsed.data.primary_key || ""),
          secondary_key: encryptSecret(parsed.data.secondary_key || ""),
          signup_url: officialSignupUrl || "",
          connection_method: connectionMethod,
        },
        connected,
        last_test_status: lastTestStatus,
        last_test_message: lastTestMessage,
        updated_at: new Date().toISOString(),
      };
      const existing = (await getAdminDb().select<{ id: string }>("platform_accounts", {
        select: "id",
        platform: `eq.${parsed.data.platform}`,
        user_id: parsed.data.user_id ? `eq.${parsed.data.user_id}` : "is.null",
        order: "updated_at.desc",
        limit: "1",
      }))[0];
      const rows = existing
        ? await getAdminDb().update("platform_accounts", { id: existing.id }, payload)
        : await getAdminDb().insert("platform_accounts", payload);
      if (contentType.includes("application/json")) return NextResponse.json({ account: rows[0] });
    } else {
      const saved = await saveLocalPlatformAccount(localAccount);
      if (contentType.includes("application/json")) return NextResponse.json({ account: saved });
    }

    if (connectionMethod === "external_login" && officialSignupUrl) {
      return NextResponse.redirect(officialSignupUrl, 303);
    }
    const referer = req.headers.get("referer") || "/dashboard/providers";
    return NextResponse.redirect(new URL(referer, req.url), 303);
  }
  const parsed = aiConfigSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: "Configuracion de IA invalida" }, { status: 400 });
  const update = {
    store_name: parsed.data.store_name,
    store_slug: parsed.data.store_name ? slugify(String(parsed.data.store_name)) : undefined,
    currency: parsed.data.currency,
    ai_provider: parsed.data.ai_provider,
    ai_model: parsed.data.ai_model,
    ai_api_key: parsed.data.ai_api_key,
    ollama_base_url: parsed.data.ollama_base_url,
    open_webui_url: parsed.data.open_webui_url,
    open_webui_api_key: parsed.data.open_webui_api_key,
    perplexica_url: parsed.data.perplexica_url,
    n8n_url: parsed.data.n8n_url,
    image_provider: parsed.data.image_provider,
    image_model: parsed.data.image_model,
    image_api_key: parsed.data.image_api_key,
    image_base_url: parsed.data.image_base_url,
  };
  const saved = await saveLocalAiConfig(update);
  if (contentType.includes("application/json")) return NextResponse.json({ saved });
  const referer = req.headers.get("referer") || "/dashboard/settings/ai-config";
  return NextResponse.redirect(new URL(referer, req.url), 303);
}
