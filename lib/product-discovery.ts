import { AmazonApi } from "@/lib/amazon-api";
import { ClickBankApi } from "@/lib/clickbank-api";
import { CjAffiliateApi } from "@/lib/cj-affiliate-api";
import { fetchGumroadProducts, fetchWarriorPlusProducts } from "@/lib/digital-platform-apis";
import { getProviderAccounts } from "@/lib/platform-accounts";
import type { ExternalProduct, Platform } from "@/types";

export type DiscoveryResult = ExternalProduct & {
  source_status: "api" | "local";
  source_note: string;
};

// Legacy physical-provider seed kept only for compatibility while the Digital Hub migration removes it from the main UI.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const localCatalog: ExternalProduct[] = [
  { platform: "amazon", external_id: "air-fryer-001", title: "Freidora de aire digital 6L", description: "Producto para cocina con alta demanda en hogar, recetas saludables y contenido comparativo.", price: 89.99, currency: "USD", image_url: "", affiliate_url: "https://www.amazon.com/s?k=freidora+de+aire", rating: 4.6, review_count: 3400, category: "Hogar y cocina", commission_rate: 4.5 },
  { platform: "amazon", external_id: "knife-set-001", title: "Set de cuchillos de cocina profesional", description: "Producto evergreen para cocina, regalos y recetas. Buen encaje para SEO de comparativas.", price: 39.99, currency: "USD", image_url: "", affiliate_url: "https://www.amazon.com/s?k=set+cuchillos+cocina", rating: 4.5, review_count: 2100, category: "Hogar y cocina", commission_rate: 4.5 },
  { platform: "amazon", external_id: "pet-feeder-001", title: "Comedero automatico para mascotas", description: "Producto fuerte en nicho mascotas, ideal para dueños de gatos y perros que trabajan fuera.", price: 69.99, currency: "USD", image_url: "", affiliate_url: "https://www.amazon.com/s?k=comedero+automatico+mascotas", rating: 4.4, review_count: 1800, category: "Mascotas", commission_rate: 4.0 },
  { platform: "amazon", external_id: "pet-camera-001", title: "Camara inteligente para vigilar mascotas", description: "Producto de smart home y mascotas con buen angulo para seguridad, tranquilidad y monitoreo.", price: 49.99, currency: "USD", image_url: "", affiliate_url: "https://www.amazon.com/s?k=camara+mascotas", rating: 4.3, review_count: 1200, category: "Mascotas", commission_rate: 4.0 },
  { platform: "clickbank", external_id: "wellness-001", title: "Programa digital de bienestar y salud", description: "Producto digital tipo ClickBank con comision alta y enfoque en habitos saludables.", price: 59, currency: "USD", image_url: "", affiliate_url: "https://www.clickbank.com/marketplace", category: "Suplementos y salud", commission_rate: 55 },
  { platform: "clickbank", external_id: "fitness-001", title: "Curso de fitness en casa", description: "Curso digital para rutinas desde casa, publico amplio y comision alta.", price: 49, currency: "USD", image_url: "", affiliate_url: "https://www.clickbank.com/marketplace", category: "Fitness en casa", commission_rate: 50 },
  { platform: "cj", external_id: "saas-001", title: "Software SaaS para productividad", description: "Oferta de software con potencial de comision recurrente y buen valor por cliente.", price: 29, currency: "USD", image_url: "", affiliate_url: "https://www.cj.com/", category: "Software SaaS", commission_rate: 25 },
  { platform: "hotmart", external_id: "curso-digital-001", title: "Curso online de automatizacion con IA", description: "Producto digital para aprender automatizacion, prompts y sistemas de venta.", price: 97, currency: "USD", image_url: "", affiliate_url: "https://app.hotmart.com/market", category: "Productos digitales", commission_rate: 40 },
  { platform: "gumroad", external_id: "plantillas-ia-001", title: "Pack de plantillas y recursos IA", description: "Plantillas digitales, prompts y recursos descargables para creadores.", price: 29, currency: "USD", image_url: "", affiliate_url: "https://gumroad.com/discover", category: "Productos digitales", commission_rate: 0 },
  { platform: "payhip", external_id: "ebook-digital-001", title: "Ebook guia practica de negocio digital", description: "Guia descargable para crear activos digitales y ventas automatizadas.", price: 19, currency: "USD", image_url: "", affiliate_url: "https://payhip.com/", category: "Productos digitales", commission_rate: 0 },
  { platform: "warriorplus", external_id: "marketing-software-001", title: "Software de marketing digital", description: "Herramienta digital orientada a ventas, afiliados y automatizacion.", price: 47, currency: "USD", image_url: "", affiliate_url: "https://warriorplus.com/", category: "Productos digitales", commission_rate: 50 },
  { platform: "systeme", external_id: "funnel-digital-001", title: "Funnel de venta para producto digital", description: "Producto o funnel digital publicado desde systeme.io.", price: 37, currency: "USD", image_url: "", affiliate_url: "https://systeme.io/", category: "Productos digitales", commission_rate: 0 },
];

function parsePair(value?: string) {
  const parts = String(value || "").split("|").map((item) => item.trim()).filter(Boolean);
  return parts;
}

export async function discoverProducts(keywords: string, platform: Platform | "all" = "all") {
  const accounts = await getProviderAccounts();
  const results: DiscoveryResult[] = [];
  const errors: string[] = [];
  const liveCatalogProviders = new Set<Platform>(["amazon", "clickbank", "cj", "gumroad", "warriorplus"]);
  const connectedPlatforms = accounts
    .filter((item) => item.connected && item.last_test_status === "success")
    .map((item) => item.platform);
  const wanted = platform === "all" ? new Set<Platform>(connectedPlatforms) : new Set<Platform>([platform]);

  for (const account of accounts.filter((item) => wanted.has(item.platform) && item.connected && item.last_test_status === "success")) {
    try {
      const primary = account.credentials?.primary_key || "";
      const secondary = account.credentials?.secondary_key || "";
      if (account.platform === "amazon") {
        const [secretKey, associateTag] = parsePair(secondary);
        if (!primary || !secretKey || !associateTag) throw new Error("Amazon necesita access key y secondary como secret|associateTag");
        const products = await new AmazonApi({ accessKey: primary, secretKey, associateTag }).searchItems(keywords);
        results.push(...products.map((product) => ({ ...product, source_status: "api" as const, source_note: "Encontrado via Amazon PA API" })));
      }
      if (account.platform === "clickbank") {
        if (!primary || !secondary) throw new Error("ClickBank necesita API key y nickname");
        const products = await new ClickBankApi({ apiKey: primary, accountNickname: secondary }).marketplace(keywords);
        results.push(...products.map((product) => ({ ...product, source_status: "api" as const, source_note: "Encontrado via ClickBank API" })));
      }
      if (account.platform === "cj") {
        if (!primary || !secondary) throw new Error("CJ necesita API key y website ID");
        const products = await new CjAffiliateApi({ apiKey: primary, websiteId: secondary }).products(keywords);
        results.push(...products.map((product) => ({ ...product, source_status: "api" as const, source_note: "Encontrado via CJ Product Search API" })));
      }
      if (account.platform === "gumroad") {
        if (!primary) throw new Error("Gumroad necesita access token");
        const products = await fetchGumroadProducts(primary, 24);
        results.push(...products.map((product) => ({ ...product, source_status: "api" as const, source_note: "Encontrado via Gumroad API" })));
      }
      if (account.platform === "warriorplus") {
        if (!primary) throw new Error("WarriorPlus necesita API key");
        const products = await fetchWarriorPlusProducts(primary, 24);
        results.push(...products.map((product) => ({ ...product, source_status: "api" as const, source_note: "Encontrado via WarriorPlus API" })));
      }
      if (!liveCatalogProviders.has(account.platform)) {
        errors.push(`${account.platform}: proveedor conectado, pero no expone catalogo automatico completo. Importa productos por enlace real con foto.`);
      }
    } catch (error) {
      errors.push(`${account.platform}: ${error instanceof Error ? error.message : "error desconocido"}`);
    }
  }

  return { products: results.slice(0, 36), errors };
}
