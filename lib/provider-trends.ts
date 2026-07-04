import { AmazonApi } from "@/lib/amazon-api";
import { ClickBankApi } from "@/lib/clickbank-api";
import { CjAffiliateApi } from "@/lib/cj-affiliate-api";
import { fetchGumroadProducts, fetchWarriorPlusProducts } from "@/lib/digital-platform-apis";
import type { ProviderAccount } from "@/lib/platform-accounts";
import type { ExternalProduct, Platform } from "@/types";

export const liveTrendProviders = new Set<Platform>(["amazon", "clickbank", "cj", "gumroad", "warriorplus"]);

export const providerTrendKeywords: Record<string, string[]> = {
  amazon: ["best sellers home", "trending gadgets", "new releases kitchen", "pet products best sellers"],
  clickbank: ["health", "fitness", "software", "wellness"],
  cj: ["home", "electronics", "software", "fitness"],
  gumroad: ["digital products"],
  warriorplus: ["digital products"],
};

function secondaryParts(account: ProviderAccount) {
  return String(account.credentials?.secondary_key || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function providerReadiness(account: ProviderAccount | undefined, platform: Platform) {
  if (!account) return { ready: false, message: "No hay credenciales guardadas." };
  if (!liveTrendProviders.has(platform)) return { ready: false, message: "Este proveedor aun no tiene importador API live en AFFILIX." };
  if (!account.connected || account.last_test_status !== "success") return { ready: false, message: account.last_test_message || "Guarda credenciales y pulsa Probar conexion real." };
  return { ready: true, message: "API real conectada y lista para importar." };
}

export async function fetchProviderTrendingProducts(account: ProviderAccount, limit = 8) {
  const primary = String(account.credentials?.primary_key || "").trim();
  const secondary = String(account.credentials?.secondary_key || "").trim();
  const keywords = providerTrendKeywords[account.platform] || ["trending"];
  const products: ExternalProduct[] = [];

  if (account.platform === "amazon") {
    const [secretKey, associateTag] = secondaryParts(account);
    const api = new AmazonApi({ accessKey: primary, secretKey, associateTag });
    for (const keyword of keywords) products.push(...await api.searchItems(keyword));
  }

  if (account.platform === "clickbank") {
    const api = new ClickBankApi({ apiKey: primary, accountNickname: secondary });
    for (const keyword of keywords) products.push(...await api.marketplace(keyword));
  }

  if (account.platform === "cj") {
    const api = new CjAffiliateApi({ apiKey: primary, websiteId: secondary });
    for (const keyword of keywords) products.push(...await api.products(keyword));
  }

  if (account.platform === "gumroad") {
    products.push(...await fetchGumroadProducts(primary, limit));
  }

  if (account.platform === "warriorplus") {
    products.push(...await fetchWarriorPlusProducts(primary, limit));
  }

  const seen = new Set<string>();
  return products
    .filter((product) => product.title && product.affiliate_url && product.image_url)
    .filter((product) => {
      const key = `${product.platform}:${product.external_id || product.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}
