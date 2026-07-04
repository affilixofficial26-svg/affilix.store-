import { fetchWithTimeout, retry } from "@/lib/utils";

const imageMetaPattern = /<meta\s+(?:property|name)=["'](?:og:image|twitter:image|image)["']\s+content=["']([^"']+)["'][^>]*>|<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["'](?:og:image|twitter:image|image)["'][^>]*>|<link\s+rel=["']image_src["']\s+href=["']([^"']+)["'][^>]*>/i;

export async function resolveProviderImageUrl(productUrl: string) {
  const url = new URL(productUrl);
  const res = await retry(() => fetchWithTimeout(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 AFFILIX Product Image Resolver",
      Accept: "text/html,application/xhtml+xml",
    },
  }, 10_000), 2);
  if (!res.ok) throw new Error(`El proveedor no permitio leer la ficha: ${res.status}`);

  const html = (await res.text()).slice(0, 250_000);
  const match = html.match(imageMetaPattern);
  const raw = match?.[1] || match?.[2] || match?.[3];
  if (!raw) throw new Error("No encontre imagen publica en la ficha del proveedor.");

  const imageUrl = new URL(raw, url.origin).toString();
  if (!/^https?:\/\//i.test(imageUrl)) throw new Error("La imagen encontrada no es una URL publica.");
  return imageUrl;
}
