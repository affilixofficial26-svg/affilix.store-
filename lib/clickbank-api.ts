import type { ExternalProduct } from "@/types";
import { fetchWithTimeout, retry } from "@/lib/utils";

interface ClickBankCredentials {
  apiKey: string;
  accountNickname: string;
}

type ClickBankProduct = {
  sku?: string;
  id?: string;
  vendor?: string;
  site?: string;
  title?: string;
  name?: string;
  description?: string;
  pitch?: string;
  initialPrice?: number | string;
  price?: number | string;
  currency?: string;
  image?: string;
  imageUrl?: string;
  category?: string;
  commission?: number | string;
  commissionRate?: number | string;
  gravity?: number | string;
};

type ClickBankMarketplaceResponse = ClickBankProduct[] | {
  products?: ClickBankProduct[];
  product?: ClickBankProduct[];
};

export class ClickBankApi {
  private readonly baseUrl = "https://api.clickbank.com/rest/1.3";

  constructor(private readonly credentials: ClickBankCredentials) {}

  async marketplace(keywords?: string): Promise<ExternalProduct[]> {
    const url = new URL(`${this.baseUrl}/products/list`);
    url.searchParams.set("site", "affiliate");
    url.searchParams.set("orderby", "gravity");
    if (keywords) url.searchParams.set("keywords", keywords);
    const res = await retry(() =>
      fetchWithTimeout(url.toString(), {
        headers: { Authorization: this.credentials.apiKey, Accept: "application/json" },
      }),
    );
    if (!res.ok) throw new Error(`ClickBank API error: ${await res.text()}`);
    const data = (await res.json()) as ClickBankMarketplaceResponse;
    const rows = Array.isArray(data) ? data : data.products || data.product || [];
    return rows
      .map((item): ExternalProduct & { gravity?: number } => ({
        platform: "clickbank",
        external_id: String(item.sku || item.id || item.vendor || item.title),
        title: item.title || item.name || item.sku || item.id || "Producto ClickBank",
        description: item.description || item.pitch || "",
        price: Number(item.initialPrice || item.price || 0),
        currency: item.currency || "USD",
        image_url: item.image || item.imageUrl,
        affiliate_url: this.hoplink(item.vendor || item.site || item.sku || item.id || "vendor"),
        rating: undefined,
        review_count: undefined,
        category: item.category,
        commission_rate: Number(item.commission || item.commissionRate || 50),
        gravity: Number(item.gravity || 0),
      }))
      .filter((product: ExternalProduct & { gravity?: number }) => (product.gravity || 0) >= 20);
  }

  async product(sku: string) {
    const res = await retry(() =>
      fetchWithTimeout(`${this.baseUrl}/products/${encodeURIComponent(sku)}`, {
        headers: { Authorization: this.credentials.apiKey, Accept: "application/json" },
      }),
    );
    if (!res.ok) throw new Error(`ClickBank product error: ${await res.text()}`);
    return res.json();
  }

  hoplink(vendor: string) {
    return `https://${this.credentials.accountNickname}.${vendor}.hop.clickbank.net`;
  }
}
