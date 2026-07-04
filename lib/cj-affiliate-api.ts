import type { ExternalProduct } from "@/types";
import { fetchWithTimeout, retry } from "@/lib/utils";

interface CjCredentials {
  apiKey: string;
  websiteId: string;
}

type CjProduct = {
  sku?: string;
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  price?: number | string;
  currency?: string;
  imageUrl?: string;
  image?: string;
  buyUrl?: string;
  link?: string;
  url?: string;
  category?: string;
  commissionRate?: number | string;
};

type CjProductsResponse = {
  products?: CjProduct[];
  "cj-api"?: {
    products?: CjProduct[];
  };
};

export class CjAffiliateApi {
  constructor(private readonly credentials: CjCredentials) {}

  async products(keywords: string): Promise<ExternalProduct[]> {
    if (!keywords.trim()) throw new Error("keywords es obligatorio");
    const url = new URL("https://product-search.api.cj.com/v2/product-search");
    url.searchParams.set("website-id", this.credentials.websiteId);
    url.searchParams.set("keywords", keywords);
    url.searchParams.set("records-per-page", "25");
    const res = await retry(() =>
      fetchWithTimeout(url.toString(), {
        headers: { Authorization: `Bearer ${this.credentials.apiKey}`, Accept: "application/json" },
      }),
    );
    if (!res.ok) throw new Error(`CJ API error: ${await res.text()}`);
    const data = (await res.json()) as CjProductsResponse;
    const rows = data.products || data["cj-api"]?.products || [];
    return rows.map((item) => ({
      platform: "cj",
      external_id: String(item.sku || item.id || item.name),
      title: item.name || item.title || String(item.sku || item.id || "Producto CJ"),
      description: item.description || "",
      price: Number(item.price || 0),
      currency: item.currency || "USD",
      image_url: item.imageUrl || item.image,
      affiliate_url: item.buyUrl || item.link || item.url || "https://www.cj.com/",
      category: item.category,
      commission_rate: Number(item.commissionRate || 5),
    }));
  }
}
