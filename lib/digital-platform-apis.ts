import { fetchWithTimeout, retry } from "@/lib/utils";
import type { ExternalProduct } from "@/types";

export async function testHotmartCredentials(clientId: string, secondary: string) {
  const [clientSecret, basicToken] = secondary.split("|").map((item) => item.trim());
  if (!clientId || !clientSecret) throw new Error("Hotmart necesita Client ID y Client Secret.");
  const basic = basicToken || Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const url = new URL("https://api-sec-vlc.hotmart.com/security/oauth/token");
  url.searchParams.set("grant_type", "client_credentials");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  const res = await retry(() => fetchWithTimeout(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
  }, 12_000), 2);
  if (!res.ok) throw new Error(`Hotmart OAuth error: ${await res.text()}`);
  const data = await res.json() as { access_token?: string };
  if (!data.access_token) throw new Error("Hotmart no devolvio access_token.");
  return "Hotmart Developers respondio correctamente. La cuenta queda validada; los productos aprobados se importan por HotLink real.";
}

export async function testDigistoreCredentials(apiKey: string) {
  if (!apiKey.trim()) throw new Error("Digistore24 necesita API key.");
  const res = await retry(() => fetchWithTimeout("https://www.digistore24.com/api/call/listProductGroups", {
    method: "GET",
    headers: {
      "X-DS-API-KEY": apiKey.trim(),
      Accept: "application/json",
    },
  }, 12_000), 2);
  if (!res.ok) throw new Error(`Digistore24 API error: ${await res.text()}`);
  const data = await res.json() as { result?: string; message?: string; code?: number } | Array<unknown>;
  if (!Array.isArray(data) && data.result === "error") {
    throw new Error(`Digistore24 API error: ${data.message || `codigo ${data.code || "desconocido"}`}`);
  }
  return "Digistore24 API respondio correctamente. La cuenta queda conectada; puedes publicar productos por enlace real aprobado y foto publica.";
}

export async function testJvZooCredentials(apiKey: string) {
  if (!apiKey.trim()) throw new Error("JVZoo necesita API key.");
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const auth = Buffer.from(`${apiKey.trim()}:x`).toString("base64");
  const res = await retry(() => fetchWithTimeout(`https://api.jvzoo.com/v3.0/transactions?start_date=${startDate}&end_date=${endDate}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  }, 12_000), 2);
  if (!res.ok) throw new Error(`JVZoo API error: ${await res.text()}`);
  const data = await res.json() as { meta?: { status?: { code?: number; message?: string; detail?: string | null } } };
  const code = data.meta?.status?.code;
  if (code && code >= 4000) {
    throw new Error(`JVZoo API error: ${data.meta?.status?.message || code}`);
  }
  return "JVZoo API respondio correctamente. La API key es valida; los productos se publican pegando enlaces aprobados de afiliado con foto publica.";
}

type GumroadProduct = {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  short_url?: string;
  preview_url?: string;
  custom_permalink?: string;
  thumbnail_url?: string;
  published?: boolean;
};

async function gumroadRequest<T>(accessToken: string, endpoint: string) {
  const url = new URL(`https://api.gumroad.com/v2/${endpoint.replace(/^\//, "")}`);
  url.searchParams.set("access_token", accessToken);
  const res = await retry(() => fetchWithTimeout(url.toString(), { method: "GET" }, 12_000), 2);
  if (!res.ok) throw new Error(`Gumroad API error: ${await res.text()}`);
  return await res.json() as T;
}

export async function testGumroadCredentials(accessToken: string) {
  const data = await gumroadRequest<{ success?: boolean }>(accessToken, "user");
  if (!data.success) throw new Error("Gumroad no valido el access token.");
  const products = await gumroadRequest<{ success?: boolean; products?: GumroadProduct[] }>(accessToken, "products");
  if (!products.success) throw new Error("Gumroad no devolvio productos.");
  const publishedProducts = (products.products || []).filter((product) => product.published !== false);
  if (!publishedProducts.length) {
    return "Gumroad API respondio correctamente, pero esta cuenta no tiene productos publicados para importar. Crea/publica productos en Gumroad o importa enlaces reales manualmente con foto.";
  }
  return `Gumroad API respondio correctamente. Productos publicados disponibles para importar: ${publishedProducts.length}.`;
}

export async function fetchGumroadProducts(accessToken: string, limit = 8): Promise<ExternalProduct[]> {
  const data = await gumroadRequest<{ success?: boolean; products?: GumroadProduct[] }>(accessToken, "products");
  if (!data.success) throw new Error("Gumroad no devolvio productos.");
  return (data.products || [])
    .filter((product) => product.published !== false)
    .map((product) => {
      const url = product.short_url || product.preview_url || (product.custom_permalink ? `https://gumroad.com/l/${product.custom_permalink}` : "https://gumroad.com/");
      return {
        platform: "gumroad",
        external_id: String(product.id || product.name || url),
        title: product.name || "Producto Gumroad",
        description: product.description || "",
        price: typeof product.price === "number" ? product.price / 100 : 0,
        currency: "USD",
        image_url: product.thumbnail_url || product.preview_url,
        affiliate_url: url,
        category: "Productos digitales",
        commission_rate: 0,
      } satisfies ExternalProduct;
    })
    .slice(0, limit);
}

export async function testWarriorPlusCredentials(apiKey: string) {
  const res = await retry(() => fetchWithTimeout("https://warriorplus.com/api/v2/products", {
    headers: { apiKey, Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  }, 12_000), 2);
  if (!res.ok) throw new Error(`WarriorPlus API error: ${await res.text()}`);
  const products = await res.json() as { data?: Array<Record<string, unknown>>; products?: Array<Record<string, unknown>> };
  const rows = products.data || products.products || [];

  const offersRes = await retry(() => fetchWithTimeout("https://warriorplus.com/api/v2/offers", {
    headers: { apiKey, Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  }, 12_000), 2);
  const offers = offersRes.ok ? await offersRes.json() as { data?: Array<Record<string, unknown>> } : { data: [] };

  const affiliateRequestsRes = await retry(() => fetchWithTimeout("https://warriorplus.com/api/v2/affiliate_requests?as=affiliate&limit=100", {
    headers: { apiKey, Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  }, 12_000), 2);
  const affiliateRequests = affiliateRequestsRes.ok ? await affiliateRequestsRes.json() as { data?: Array<Record<string, unknown>> } : { data: [] };

  if (!rows.length && !(offers.data || []).length && !(affiliateRequests.data || []).length) {
    return "WarriorPlus API respondio correctamente, pero esta cuenta no tiene productos de vendedor, ofertas ni solicitudes de afiliado aprobadas. Aprueba productos/ofertas en WarriorPlus o importa enlaces reales manualmente con foto.";
  }

  return `WarriorPlus API respondio correctamente. Productos: ${rows.length}. Ofertas: ${(offers.data || []).length}. Solicitudes afiliadas: ${(affiliateRequests.data || []).length}.`;
}

export async function fetchWarriorPlusProducts(apiKey: string, limit = 8): Promise<ExternalProduct[]> {
  const res = await retry(() => fetchWithTimeout("https://warriorplus.com/api/v2/products", {
    headers: { apiKey, Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  }, 12_000), 2);
  if (!res.ok) throw new Error(`WarriorPlus API error: ${await res.text()}`);
  const data = await res.json() as { products?: Array<Record<string, unknown>>; data?: Array<Record<string, unknown>> };
  const rows = data.products || data.data || [];
  return rows.map((item) => ({
    platform: "warriorplus",
    external_id: String(item.id || item.product_id || item.name || item.title),
    title: String(item.name || item.title || "Producto WarriorPlus"),
    description: String(item.description || ""),
    price: Number(item.price || 0),
    currency: "USD",
    image_url: String(item.image || item.image_url || ""),
    affiliate_url: String(item.affiliate_url || item.url || item.link || "https://warriorplus.com/"),
    category: "Productos digitales",
    commission_rate: Number(item.commission_rate || item.commission || 0),
  } satisfies ExternalProduct)).slice(0, limit);
}
