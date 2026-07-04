import type { AffiliateProduct } from "@/types";

function cleanBaseUrl(value: string) {
  const cleaned = value.trim().replace(/^[\uFEFF\u00EF\u00BB\u00BF]+/, "");
  const urlStart = cleaned.search(/https?:\/\//i);
  return (urlStart >= 0 ? cleaned.slice(urlStart) : cleaned).replace(/\/$/, "");
}

export function getStoreBaseUrl() {
  return cleanBaseUrl(process.env.NEXT_PUBLIC_STORE_URL || "https://affilix.store");
}

export function getPublicProductUrl(product: Pick<AffiliateProduct, "slug">) {
  return `${getStoreBaseUrl()}/productos/${product.slug}`;
}

export function getPublicOutboundUrl(product: Pick<AffiliateProduct, "slug">) {
  return `${getStoreBaseUrl()}/go/${product.slug}`;
}
