import { fetchWithTimeout, retry } from "@/lib/utils";

function extractMeta(html: string, names: string[]) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const propertyFirst = new RegExp(`<meta\\s+(?:property|name)=["']${escaped}["']\\s+content=["']([^"']+)["'][^>]*>`, "i");
    const contentFirst = new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']${escaped}["'][^>]*>`, "i");
    const match = html.match(propertyFirst) || html.match(contentFirst);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return "";
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function fetchProviderPageMetadata(productUrl: string) {
  const url = new URL(productUrl);
  const res = await retry(() => fetchWithTimeout(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 AFFILIX Product Metadata Resolver",
      Accept: "text/html,application/xhtml+xml",
    },
  }, 12_000), 2);
  if (!res.ok) throw new Error(`El proveedor no permitio leer la ficha: ${res.status}`);

  const html = (await res.text()).slice(0, 300_000);
  const title = extractMeta(html, ["og:title", "twitter:title"]) || decodeHtml((html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim());
  const description = extractMeta(html, ["og:description", "twitter:description", "description"]);
  const imageRaw = extractMeta(html, ["og:image", "twitter:image", "image"]);
  const imageUrl = imageRaw ? new URL(imageRaw, url.origin).toString() : "";

  return {
    title,
    description,
    imageUrl,
  };
}
