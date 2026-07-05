import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AmazonApi } from "@/lib/amazon-api";
import { ClickBankApi } from "@/lib/clickbank-api";
import { CjAffiliateApi } from "@/lib/cj-affiliate-api";
import { testDigistoreCredentials, testGumroadCredentials, testHotmartCredentials, testJvZooCredentials, testWarriorPlusCredentials } from "@/lib/digital-platform-apis";
import { generateText } from "@/lib/openai-client";
import { getProviderAccountMap, saveProviderAccountResult } from "@/lib/platform-accounts";
import type { ProviderAccount } from "@/lib/platform-accounts";
import { decryptSecret, encryptSecret } from "@/lib/security";
import { getAdminDb } from "@/lib/supabase";
import { notifyProviderError } from "@/lib/system-email";
import type { Platform } from "@/types";

const platformSchema = z.enum(["amazon", "amazon_seller", "ebay", "rakuten", "clickbank", "hotmart", "gumroad", "payhip", "warriorplus", "systeme", "digistore", "jvzoo", "cj", "shareasale", "impact", "awin", "spocket", "cjdrop", "walmart", "temu", "shein", "flexoffers", "partnerstack", "fiverr", "semrush", "hubspot", "booking", "agoda", "coinbase", "binance", "aliexpress", "teachable", "shopify", "etsy"]);

const supportedLiveApi = new Set<Platform>(["amazon", "clickbank", "cj", "hotmart", "gumroad", "warriorplus", "payhip", "systeme", "digistore", "jvzoo"]);

type StoredPlatformAccount = {
  id?: string;
  platform: Platform;
  credentials?: {
    primary_key?: string;
    secondary_key?: string;
  };
  connected: boolean;
  last_test_status: "success" | "error" | null;
  last_test_message: string | null;
};

function hasSupabase() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function fromStoredAccount(account: StoredPlatformAccount): ProviderAccount {
  return {
    platform: account.platform,
    connected: account.connected,
    connection_method: "manual_credentials",
    credentials: {
      primary_key: decryptSecret(account.credentials?.primary_key),
      secondary_key: decryptSecret(account.credentials?.secondary_key),
    },
    last_test_status: account.last_test_status,
    last_test_message: account.last_test_message,
    updated_at: new Date().toISOString(),
  };
}

function splitSecondary(account: ProviderAccount) {
  return String(account.credentials?.secondary_key || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function missingCredentials(account: ProviderAccount) {
  const primary = String(account.credentials?.primary_key || "").trim();
  const secondary = String(account.credentials?.secondary_key || "").trim();

  if (account.platform === "amazon") {
    const [secretKey, associateTag] = splitSecondary(account);
    const missing = [];
    if (!primary) missing.push("Access key");
    if (!secretKey) missing.push("Secret key");
    if (!associateTag) missing.push("Associate tag");
    return missing;
  }

  if (account.platform === "amazon_seller") {
    const parts = splitSecondary(account);
    const missing = [];
    if (!primary) missing.push("Seller ID");
    if (parts.length < 4) missing.push("Marketplace ID, LWA Client ID, LWA Client Secret y Refresh token en el segundo campo separados por |");
    return missing;
  }

  if (account.platform === "hotmart") {
    const [clientSecret] = splitSecondary(account);
    const missing = [];
    if (!primary) missing.push("Client ID");
    if (!clientSecret) missing.push("Client Secret");
    return missing;
  }

  if (["gumroad", "payhip", "warriorplus", "systeme", "digistore", "jvzoo", "impact", "walmart", "temu", "shein", "flexoffers", "partnerstack", "fiverr", "semrush", "hubspot", "booking", "agoda", "coinbase", "binance", "aliexpress", "teachable", "shopify", "etsy"].includes(account.platform)) {
    return primary ? [] : ["API key / access token"];
  }

  const missing = [];
  if (!primary) missing.push("clave principal");
  if (!secondary) missing.push("clave secundaria");
  return missing;
}

async function runLiveProviderTest(account: ProviderAccount) {
  const primary = String(account.credentials?.primary_key || "").trim();
  const [firstSecondary, secondSecondary] = splitSecondary(account);
  const secondary = String(account.credentials?.secondary_key || "").trim();

  if (account.platform === "amazon") {
    await new AmazonApi({ accessKey: primary, secretKey: firstSecondary, associateTag: secondSecondary }).searchItems("home");
    return "Amazon Product Advertising API respondio correctamente. El proveedor queda listo para importar productos reales.";
  }

  if (account.platform === "clickbank") {
    await new ClickBankApi({ apiKey: primary, accountNickname: secondary }).marketplace("health");
    return "ClickBank API respondio correctamente. El proveedor queda listo para importar productos reales.";
  }

  if (account.platform === "cj") {
    await new CjAffiliateApi({ apiKey: primary, websiteId: secondary }).products("home");
    return "CJ Product Search API respondio correctamente. El proveedor queda listo para importar productos reales.";
  }

  if (account.platform === "hotmart") {
    return testHotmartCredentials(primary, secondary);
  }

  if (account.platform === "gumroad") {
    return testGumroadCredentials(primary);
  }

  if (account.platform === "warriorplus") {
    return testWarriorPlusCredentials(primary);
  }

  if (account.platform === "digistore") {
    return testDigistoreCredentials(primary);
  }

  if (account.platform === "jvzoo") {
    return testJvZooCredentials(primary);
  }

  if (account.platform === "payhip") {
    return "Payhip guardado. Su API publica actual no expone feed completo de productos; AFFILIX queda listo para publicar productos Payhip por enlace real con foto automatica.";
  }

  if (account.platform === "systeme") {
    return "systeme.io guardado. AFFILIX queda listo para publicar funnels/productos systeme.io por enlace real con foto automatica.";
  }

  return "";
}

async function persistResult(account: ProviderAccount, connected: boolean, status: "success" | "error", message: string) {
  if (hasSupabase()) {
    const rows = await getAdminDb().select<StoredPlatformAccount>("platform_accounts", {
      select: "id",
      platform: `eq.${account.platform}`,
      user_id: "is.null",
      order: "updated_at.desc",
      limit: "1",
    });
    const payload = {
      user_id: null,
      platform: account.platform,
      credentials: {
        primary_key: encryptSecret(account.credentials?.primary_key || ""),
        secondary_key: encryptSecret(account.credentials?.secondary_key || ""),
      },
      connected,
      last_test_status: status,
      last_test_message: message,
      updated_at: new Date().toISOString(),
    };
    if (rows[0]?.id) return getAdminDb().update("platform_accounts", { id: rows[0].id }, payload);
    return getAdminDb().insert("platform_accounts", payload);
  }

  return saveProviderAccountResult(account, connected, status, message);
}

async function persistErrorAndNotify(account: ProviderAccount, message: string, severity: "low" | "medium" | "high" = "medium") {
  await persistResult(account, false, "error", message);
  await notifyProviderError({ platform: account.platform, message, severity });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());

  if (data.ai_provider) {
    const text = await generateText({ provider: data.ai_provider, apiKey: data.ai_api_key, model: data.ai_model, ollamaBaseUrl: data.ollama_base_url }, "Responde solo: OK");
    return NextResponse.json({ ok: true, message: text });
  }

  const parsed = platformSchema.safeParse(data.platform);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Proveedor invalido" }, { status: 400 });

  const platform = parsed.data;
  let account: ProviderAccount | undefined;
  if (hasSupabase()) {
    const rows = await getAdminDb().select<StoredPlatformAccount>("platform_accounts", {
      select: "*",
      platform: `eq.${platform}`,
      user_id: "is.null",
      order: "updated_at.desc",
      limit: "1",
    });
    account = rows[0] ? fromStoredAccount(rows[0]) : undefined;
  } else {
    account = (await getProviderAccountMap()).get(platform);
  }
  const referer = req.headers.get("referer") || "/dashboard/integrations";

  if (!account) {
    const message = "No hay datos guardados para este proveedor. Abre el proveedor y guarda sus credenciales API antes de probar.";
    if (contentType.includes("application/json")) return NextResponse.json({ ok: false, message }, { status: 404 });
    return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}provider_test=error`, req.url), 303);
  }

  const missing = missingCredentials(account);
  if (missing.length) {
    const message = `Faltan credenciales: ${missing.join(", ")}. Guarda esos datos y vuelve a probar.`;
    await persistErrorAndNotify(account, message, "medium");
    if (contentType.includes("application/json")) return NextResponse.json({ ok: false, message }, { status: 400 });
    return NextResponse.redirect(new URL(referer, req.url), 303);
  }

  if (!supportedLiveApi.has(platform)) {
    const message = "Credenciales guardadas y proveedor activado para publicar por enlace real. Este proveedor no expone catalogo API automatico completo en AFFILIX; pega enlaces aprobados para importar titulo, foto y URL afiliada.";
    await persistResult(account, true, "success", message);
    if (contentType.includes("application/json")) return NextResponse.json({ ok: true, message });
    return NextResponse.redirect(new URL(referer, req.url), 303);
  }

  try {
    const message = await runLiveProviderTest(account);
    await persistResult(account, true, "success", message);
    if (contentType.includes("application/json")) return NextResponse.json({ ok: true, message });
    return NextResponse.redirect(new URL(referer, req.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "El proveedor no respondio correctamente.";
    await persistErrorAndNotify(account, message, "high");
    if (contentType.includes("application/json")) return NextResponse.json({ ok: false, message }, { status: 400 });
    return NextResponse.redirect(new URL(referer, req.url), 303);
  }
}
