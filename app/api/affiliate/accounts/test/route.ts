import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AmazonApi } from "@/lib/amazon-api";
import { getCurrentAffiliatePartner } from "@/lib/affiliate-auth";
import { getAffiliateProviderAccountMap, saveAffiliateProviderTestResult, type AffiliateProviderAccount } from "@/lib/affiliate-provider-accounts";
import { ClickBankApi } from "@/lib/clickbank-api";
import { CjAffiliateApi } from "@/lib/cj-affiliate-api";
import { testDigistoreCredentials, testGumroadCredentials, testHotmartCredentials, testJvZooCredentials, testWarriorPlusCredentials } from "@/lib/digital-platform-apis";
import type { Platform } from "@/types";

const platformSchema = z.enum(["amazon", "amazon_seller", "ebay", "rakuten", "clickbank", "hotmart", "gumroad", "payhip", "warriorplus", "systeme", "digistore", "jvzoo", "cj", "shareasale", "impact", "awin", "spocket", "cjdrop", "walmart", "temu", "shein", "flexoffers", "partnerstack", "fiverr", "semrush", "hubspot", "booking", "agoda", "coinbase", "binance", "aliexpress", "teachable", "shopify", "etsy"]);

const supportedLiveApi = new Set<Platform>(["amazon", "clickbank", "cj", "hotmart", "gumroad", "warriorplus", "payhip", "systeme", "digistore", "jvzoo"]);

function splitSecondary(account: AffiliateProviderAccount) {
  return String(account.credentials?.secondary_key || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function missingCredentials(account: AffiliateProviderAccount) {
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

async function runLiveProviderTest(account: AffiliateProviderAccount) {
  const primary = String(account.credentials?.primary_key || "").trim();
  const [firstSecondary, secondSecondary] = splitSecondary(account);
  const secondary = String(account.credentials?.secondary_key || "").trim();

  if (account.platform === "amazon") {
    await new AmazonApi({ accessKey: primary, secretKey: firstSecondary, associateTag: secondSecondary }).searchItems("home");
    return "Amazon respondio correctamente. Tu cuenta queda lista para publicar productos con tus enlaces.";
  }

  if (account.platform === "clickbank") {
    await new ClickBankApi({ apiKey: primary, accountNickname: secondary }).marketplace("health");
    return "ClickBank respondio correctamente. Tu cuenta queda lista para publicar productos digitales.";
  }

  if (account.platform === "cj") {
    await new CjAffiliateApi({ apiKey: primary, websiteId: secondary }).products("home");
    return "CJ respondio correctamente. Tu cuenta queda lista para publicar productos.";
  }

  if (account.platform === "hotmart") return testHotmartCredentials(primary, secondary);
  if (account.platform === "gumroad") return testGumroadCredentials(primary);
  if (account.platform === "warriorplus") return testWarriorPlusCredentials(primary);
  if (account.platform === "digistore") return testDigistoreCredentials(primary);
  if (account.platform === "jvzoo") return testJvZooCredentials(primary);

  if (account.platform === "payhip") {
    return "Payhip guardado. Puedes publicar productos Payhip por enlace real con foto automatica.";
  }

  if (account.platform === "systeme") {
    return "systeme.io guardado. Puedes publicar funnels o productos por enlace real con foto automatica.";
  }

  return "";
}

export async function POST(req: NextRequest) {
  const partner = await getCurrentAffiliatePartner();
  if (!partner) return NextResponse.redirect(new URL("/affiliate/login", req.url), 303);

  const data = Object.fromEntries((await req.formData()).entries());
  const parsed = platformSchema.safeParse(data.platform);
  const referer = req.headers.get("referer") || "/affiliate/dashboard";
  if (!parsed.success) return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}provider=invalid`, req.url), 303);

  const account = (await getAffiliateProviderAccountMap(partner.id)).get(parsed.data);
  if (!account) return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}provider=missing`, req.url), 303);

  const missing = missingCredentials(account);
  if (missing.length) {
    await saveAffiliateProviderTestResult(account, false, "error", `Faltan credenciales: ${missing.join(", ")}.`);
    return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}provider=error`, req.url), 303);
  }

  if (!supportedLiveApi.has(account.platform)) {
    await saveAffiliateProviderTestResult(account, true, "success", "Credenciales guardadas y proveedor activado para publicar por enlace real. Este proveedor no expone catalogo API automatico completo en AFFILIX.");
    return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}provider=ok`, req.url), 303);
  }

  try {
    const message = await runLiveProviderTest(account);
    await saveAffiliateProviderTestResult(account, true, "success", message);
    return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}provider=ok`, req.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "El proveedor no respondio correctamente.";
    await saveAffiliateProviderTestResult(account, false, "error", message);
    return NextResponse.redirect(new URL(`${referer}${referer.includes("?") ? "&" : "?"}provider=error`, req.url), 303);
  }
}
