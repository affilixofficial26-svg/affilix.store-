import { getAdminDb } from "@/lib/supabase";

export type DigitalItemType =
  | "digital_product"
  | "saas_offer"
  | "service_template"
  | "business_kit"
  | "bundle"
  | "lead_magnet"
  | "subscription_plan";

export type DigitalCatalogItem = {
  id: string;
  item_type: DigitalItemType;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  status: "draft" | "review" | "published" | "archived";
  price: number | string | null;
  currency: string;
  image_url: string | null;
  category: string | null;
  tags: string[];
  language: string;
  commercial_use: boolean;
  delivery_type: "download" | "service" | "external" | "access";
  external_url: string | null;
  affiliate_disclosure: boolean;
  featured: boolean;
  total_views: number;
  total_sales: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SaasOffer = {
  id: string;
  catalog_item_id: string;
  program_name: string;
  affiliate_url: string;
  pricing_summary: string | null;
  best_for: string | null;
  pros: string[];
  cons: string[];
  commission_summary: string | null;
  last_verified_at: string | null;
};

export type DigitalHubCatalog = {
  items: DigitalCatalogItem[];
  products: DigitalCatalogItem[];
  services: DigitalCatalogItem[];
  kits: DigitalCatalogItem[];
  tools: Array<DigitalCatalogItem & { offer?: SaasOffer }>;
  resources: DigitalCatalogItem[];
};

const DIGITAL_LEGACY_PLATFORMS = new Set([
  "clickbank",
  "hotmart",
  "gumroad",
  "payhip",
  "warriorplus",
  "systeme",
  "digistore",
  "jvzoo",
  "partnerstack",
  "fiverr",
  "semrush",
  "hubspot",
  "teachable",
]);

function splitCatalog(items: DigitalCatalogItem[], offers: SaasOffer[] = []): DigitalHubCatalog {
  const offersByItem = new Map(offers.map((offer) => [offer.catalog_item_id, offer]));
  return {
    items,
    products: items.filter((item) => item.item_type === "digital_product" || item.item_type === "bundle"),
    services: items.filter((item) => item.item_type === "service_template"),
    kits: items.filter((item) => item.item_type === "business_kit"),
    tools: items
      .filter((item) => item.item_type === "saas_offer")
      .map((item) => ({ ...item, offer: offersByItem.get(item.id) })),
    resources: items.filter((item) => item.item_type === "lead_magnet"),
  };
}

export async function getDigitalHubCatalog(limit = 120): Promise<DigitalHubCatalog> {
  try {
    const db = getAdminDb();
    const [items, offers] = await Promise.all([
      db.select<DigitalCatalogItem>("catalog_items", {
        select: "*",
        status: "eq.published",
        order: "featured.desc,created_at.desc",
        limit: String(limit),
      }),
      db.select<SaasOffer>("saas_offers", { select: "*" }),
    ]);
    return splitCatalog(items, offers);
  } catch {
    return splitCatalog([]);
  }
}

export async function getAllDigitalCatalog(limit = 250): Promise<DigitalCatalogItem[]> {
  try {
    return await getAdminDb().select<DigitalCatalogItem>("catalog_items", {
      select: "*",
      order: "updated_at.desc",
      limit: String(limit),
    });
  } catch {
    return [];
  }
}

export async function getDigitalCatalogItem(slug: string) {
  try {
    const rows = await getAdminDb().select<DigitalCatalogItem>("catalog_items", {
      select: "*",
      slug: `eq.${slug}`,
      status: "eq.published",
      limit: "1",
    });
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function getServiceTemplateByCatalogItem(catalogItemId: string) {
  try {
    const rows = await getAdminDb().select<{
      input_schema: Record<string, unknown>;
      workflow: unknown[];
      workflow_steps?: unknown[];
      internal_prompt?: string | null;
      estimated_minutes?: number | null;
      estimated_delivery_hours?: number | null;
      revision_limit?: number | null;
      included_revisions?: number | null;
      requires_review?: boolean;
      requires_human_approval?: boolean;
    }>("service_templates", {
      select: "*",
      catalog_item_id: `eq.${catalogItemId}`,
      limit: "1",
    });
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function getLegacyDigitalProductCount() {
  try {
    const products = await getAdminDb().select<{ platform: string }>("affiliate_products", {
      select: "platform",
      is_active: "eq.true",
      limit: "500",
    });
    return products.filter((product) => DIGITAL_LEGACY_PLATFORMS.has(product.platform)).length;
  } catch {
    return 0;
  }
}
