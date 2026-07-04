import crypto from "crypto";
import type { ExternalProduct } from "@/types";
import { cacheGet, cacheSet, rateLimit } from "@/lib/redis";
import { fetchWithTimeout, retry } from "@/lib/utils";

interface AmazonCredentials {
  accessKey: string;
  secretKey: string;
  associateTag: string;
  region?: string;
  marketplace?: string;
}

type AmazonSearchItem = {
  ASIN?: string;
  ItemInfo?: {
    Title?: { DisplayValue?: string };
    Features?: { DisplayValues?: string[] };
  };
  Offers?: {
    Listings?: Array<{
      Price?: { Amount?: number; Currency?: string };
    }>;
  };
  Images?: { Primary?: { Large?: { URL?: string } } };
  CustomerReviews?: { StarRating?: { Value?: string | number }; Count?: string | number };
};

type AmazonSearchResponse = {
  SearchResult?: {
    Items?: AmazonSearchItem[];
  };
};

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function amazonHost(marketplace = "www.amazon.com") {
  return `webservices.amazon.${marketplace.endsWith(".com") ? "com" : "es"}`;
}

function signPaApiRequest(credentials: AmazonCredentials, payload: string, target: string) {
  const region = credentials.region || "us-east-1";
  const service = "ProductAdvertisingAPI";
  const host = amazonHost(credentials.marketplace);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const headers = `content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${target}\n`;
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const canonicalRequest = `POST\n/paapi5/searchitems\n\n${headers}\n${signedHeaders}\n${sha256(payload)}`;
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256(canonicalRequest)}`;
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${credentials.secretKey}`, dateStamp), region), service), "aws4_request");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  return {
    host,
    headers: {
      "Content-Encoding": "amz-1.0",
      "Content-Type": "application/json; charset=utf-8",
      Host: host,
      "X-Amz-Date": amzDate,
      "X-Amz-Target": target,
      Authorization: `AWS4-HMAC-SHA256 Credential=${credentials.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  };
}

export class AmazonApi {
  constructor(private readonly credentials: AmazonCredentials) {}

  async searchItems(keywords: string, category = "All", minPrice?: number, maxPrice?: number): Promise<ExternalProduct[]> {
    if (!keywords.trim()) throw new Error("keywords es obligatorio");
    await rateLimit("amazon-paapi", 1);
    const cacheKey = `amazon:search:${keywords}:${category}:${minPrice || 0}:${maxPrice || 0}`;
    const cached = await cacheGet<ExternalProduct[]>(cacheKey);
    if (cached) return cached;
    const body = {
      Keywords: keywords,
      SearchIndex: category,
      PartnerTag: this.credentials.associateTag,
      PartnerType: "Associates",
      MinPrice: minPrice ? Math.round(minPrice * 100) : undefined,
      MaxPrice: maxPrice ? Math.round(maxPrice * 100) : undefined,
      Resources: ["Images.Primary.Large", "ItemInfo.Title", "ItemInfo.Features", "Offers.Listings.Price", "CustomerReviews.Count", "CustomerReviews.StarRating"],
    };
    const payload = JSON.stringify(body);
    const signed = signPaApiRequest(this.credentials, payload, "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems");
    const res = await retry(() => fetchWithTimeout(`https://${signed.host}/paapi5/searchitems`, { method: "POST", headers: signed.headers, body: payload }), 3);
    if (!res.ok) throw new Error(`Amazon PA API error: ${await res.text()}`);
    const data = (await res.json()) as AmazonSearchResponse;
    const products = (data.SearchResult?.Items || []).map((item) => {
      const asin = item.ASIN || "";
      const price = item.Offers?.Listings?.[0]?.Price?.Amount as number | undefined;
      return {
        platform: "amazon",
        external_id: asin,
        title: item.ItemInfo?.Title?.DisplayValue || asin,
        description: (item.ItemInfo?.Features?.DisplayValues || []).join(" "),
        price,
        currency: item.Offers?.Listings?.[0]?.Price?.Currency || "USD",
        image_url: item.Images?.Primary?.Large?.URL,
        affiliate_url: this.affiliateUrl(asin),
        rating: Number(item.CustomerReviews?.StarRating?.Value || 0),
        review_count: Number(item.CustomerReviews?.Count || 0),
        category,
        commission_rate: 4.5,
      } satisfies ExternalProduct;
    });
    await cacheSet(cacheKey, products, 1800);
    return products;
  }

  async getItems(asinList: string[]) {
    if (!asinList.length) throw new Error("asinList es obligatorio");
    return this.searchItems(asinList.join(" "), "All");
  }

  async getBrowseNodes(browseNodeIds: string[]) {
    if (!browseNodeIds.length) throw new Error("browseNodeIds es obligatorio");
    return { browseNodeIds };
  }

  affiliateUrl(asin: string) {
    return `https://www.amazon.com/dp/${encodeURIComponent(asin)}?tag=${encodeURIComponent(this.credentials.associateTag)}`;
  }
}
