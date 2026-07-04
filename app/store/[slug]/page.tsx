import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAdminDb } from "@/lib/supabase";
import { getPublicOutboundUrl, getPublicProductUrl, getStoreBaseUrl } from "@/lib/store-links";
import { money } from "@/lib/utils";
import type { AffiliateProduct } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StoreProduct = AffiliateProduct & {
  updated_at?: string | null;
  created_at?: string | null;
  total_clicks?: number | null;
};

const STORE_URL = getStoreBaseUrl();
const logoSrc = "/affilix-store-logo.png";
const internalTextPattern = /supabase|tracking|flujo|producto de prueba|publicado|tienda publica|panel|automatizad|multi-provider|service role|base de datos/i;

async function getProduct(slug: string) {
  try {
    return (await getAdminDb().select<StoreProduct>("affiliate_products", { select: "*", slug: `eq.${slug}`, is_active: "eq.true", image_url: "not.is.null", limit: "1" }))[0];
  } catch {
    return undefined;
  }
}

async function getRelatedProducts(product: StoreProduct) {
  if (!product.category) return [];
  try {
    return await getAdminDb().select<StoreProduct>("affiliate_products", {
      select: "*",
      is_active: "eq.true",
      image_url: "not.is.null",
      category: `eq.${product.category}`,
      order: "created_at.desc",
      limit: "5",
    });
  } catch {
    return [];
  }
}

function platformLabel(platform: string) {
  const labels: Record<string, string> = {
    amazon: "Amazon",
    amazon_seller: "Amazon",
    clickbank: "ClickBank",
    hotmart: "Hotmart",
    gumroad: "Gumroad",
    payhip: "Payhip",
    warriorplus: "WarriorPlus",
    systeme: "systeme.io",
    cj: "CJ",
    spocket: "Spocket",
    shopify: "Shopify",
    etsy: "Etsy",
  };
  return labels[platform] || platform;
}

function platformClass(platform: string) {
  if (platform.includes("amazon")) return "bg-[#fff3df] text-[#b46100] ring-[#ff9900]/30";
  if (platform === "clickbank") return "bg-[#e7fbf8] text-[#0f7a6d] ring-[#40B3A2]/30";
  if (platform === "hotmart") return "bg-[#fff0f3] text-[#c2173b] ring-[#f04b6a]/30";
  if (platform === "gumroad") return "bg-[#f2fff2] text-[#247a35] ring-[#36a852]/30";
  if (platform === "payhip") return "bg-[#eef7ff] text-[#1769aa] ring-[#3b9eea]/30";
  if (platform === "warriorplus") return "bg-[#fff7e8] text-[#9a5a00] ring-[#f0a92e]/30";
  if (platform === "systeme") return "bg-[#f5f1ff] text-[#6741b8] ring-[#8b6ee8]/30";
  if (platform === "cj") return "bg-[#eef4ff] text-[#2556c7] ring-[#4F7CF5]/30";
  if (platform === "spocket") return "bg-[#f4efff] text-[#6d35c8] ring-[#8B5CF6]/30";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function discount(product: StoreProduct) {
  if (!product.original_price || !product.price || product.original_price <= product.price) return null;
  return Math.max(1, Math.round(((product.original_price - product.price) / product.original_price) * 100));
}

function shortDescription(product: StoreProduct) {
  return cleanPublicText(product.ai_description || product.description, "Producto disponible en tienda online con enlace de compra externo.");
}

function cleanPublicText(value: string | null | undefined, fallback: string) {
  const text = String(value || "").trim();
  if (!text || internalTextPattern.test(text)) return fallback;
  return text;
}

function StoreLogo({ className = "h-12 w-auto" }: { className?: string }) {
  return <Image src={logoSrc} alt="affilix.store" width={420} height={180} priority className={`${className} object-contain`} />;
}

function ProductBrandOverlay() {
  return (
    <span className="absolute bottom-4 right-4 rounded-md bg-white/95 px-3 py-2 shadow-sm ring-1 ring-slate-200">
      <StoreLogo className="h-8 w-auto" />
    </span>
  );
}

function Stars({ rating }: { rating?: number | null }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="tracking-[-2px] text-[#ffa41c]">★★★★★</span>
      <strong className="text-slate-900">{rating ? `${rating.toFixed(1)}/5` : "Nuevo"}</strong>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  const title = product?.seo_title || product?.ai_title || product?.title || "Producto";
  const description = product ? cleanPublicText(product.seo_description, shortDescription(product)).slice(0, 155) : "Producto disponible en affilix.store";
  const url = `${STORE_URL}/productos/${slug}`;

  return {
    title: `${title} | affilix.store`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: product?.image_url ? [{ url: product.image_url }] : undefined,
    },
  };
}

function ProductJsonLd({ product }: { product: StoreProduct }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.ai_title || product.title,
    image: product.image_url ? [product.image_url] : undefined,
    description: shortDescription(product),
    category: product.category || undefined,
    brand: { "@type": "Brand", name: platformLabel(product.platform) },
    aggregateRating: product.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.review_count || 1,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      price: product.price || 0,
      priceCurrency: product.currency,
      availability: "https://schema.org/InStock",
      url: getPublicOutboundUrl(product),
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

function MiniProductCard({ product }: { product: StoreProduct }) {
  const image = product.image_url || product.images?.[0];
  return (
    <Link href={`/productos/${product.slug}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-square bg-slate-100">
        {image ? (
          <>
            <Image src={image} alt={product.ai_title || product.title} fill sizes="25vw" className="object-cover transition group-hover:scale-105" />
            <ProductBrandOverlay />
          </>
        ) : <div className="flex h-full items-center justify-center"><StoreLogo className="h-20 w-auto" /></div>}
      </div>
      <div className="p-4">
        <span className={`rounded-md px-2 py-1 text-[11px] font-extrabold ring-1 ${platformClass(product.platform)}`}>{platformLabel(product.platform)}</span>
        <h3 className="mt-3 line-clamp-2 text-sm font-black text-slate-900">{product.ai_title || product.title}</h3>
        <div className="mt-3 text-lg font-black">{money(product.price, product.currency)}</div>
      </div>
    </Link>
  );
}

export default async function StoreProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return (
      <main className="min-h-screen bg-[#eef3f8] px-4 py-16 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <StoreLogo className="mx-auto h-20 w-auto" />
          <h1 className="mt-6 text-3xl font-black">Producto no encontrado</h1>
          <p className="mt-3 text-slate-600">Este producto no esta disponible en la tienda.</p>
          <Link href="/productos" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#00aeef] px-5 font-black text-white">Volver a productos</Link>
        </div>
      </main>
    );
  }

  const related = (await getRelatedProducts(product)).filter((item) => item.id !== product.id).slice(0, 4);
  const title = product.ai_title || product.title;
  const productDiscount = discount(product);
  const image = product.image_url || product.images?.[0];
  const updatedAt = product.updated_at ? new Date(product.updated_at).toLocaleDateString("es-ES") : "hoy";
  const publicUrl = getPublicProductUrl(product);

  return (
    <main className="min-h-screen bg-[#eef3f8] text-slate-950">
      <ProductJsonLd product={product} />
      <header className="sticky top-0 z-50 shadow-sm">
        <div className="bg-[#06172f] px-4 py-3 text-white">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <Link href="/" aria-label="affilix.store" className="rounded-lg bg-white px-3 py-1">
              <StoreLogo className="h-12 w-auto" />
            </Link>
            <form action="/productos" className="hidden min-w-0 flex-1 overflow-hidden rounded-md bg-white md:flex">
              <input className="min-h-12 min-w-0 flex-1 px-4 text-base text-slate-950 outline-none" name="q" placeholder="Buscar productos" />
              <button className="min-h-12 bg-[#00aeef] px-5 text-sm font-extrabold text-white" type="submit">Buscar</button>
            </form>
            <Link href="/productos" className="ml-auto rounded-md border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10">Productos</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-5">
        <div className="text-sm text-slate-600">
          <Link href="/" className="hover:text-[#0077c8]">Inicio</Link> / <Link href="/productos" className="hover:text-[#0077c8]">Productos</Link> / <span>{product.category || platformLabel(product.platform)}</span>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-8 lg:grid-cols-[1fr_430px]">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
            {image ? (
              <>
                <Image src={image} alt={title} fill sizes="(max-width: 1024px) 100vw, 55vw" priority className="object-cover" />
                <ProductBrandOverlay />
              </>
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100"><StoreLogo className="h-40 w-auto" /></div>
            )}
            <span className={`absolute left-4 top-4 rounded-md px-3 py-1 text-xs font-extrabold ring-1 ${platformClass(product.platform)}`}>{platformLabel(product.platform)}</span>
            {productDiscount ? <span className="absolute right-4 top-4 rounded-md bg-[#cc0c39] px-3 py-1 text-xs font-black text-white">-{productDiscount}%</span> : null}
          </div>
        </div>

        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950">{title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Stars rating={product.rating} />
            {product.review_count ? <span className="text-sm text-slate-500">{product.review_count.toLocaleString("es-ES")} valoraciones</span> : null}
          </div>

          <div className="mt-6 border-y border-slate-200 py-5">
            {product.original_price && product.original_price > (product.price || 0) ? <div className="text-sm text-slate-400 line-through">{money(product.original_price, product.currency)}</div> : null}
            <div className="mt-1 flex flex-wrap items-end gap-3">
              <div className="text-4xl font-black">{money(product.price, product.currency)}</div>
              {productDiscount ? <div className="rounded-md bg-[#cc0c39] px-2 py-1 text-xs font-black text-white">Ahorra {productDiscount}%</div> : null}
            </div>
            <p className="mt-2 text-xs text-slate-500">Precio revisado: {updatedAt}</p>
          </div>

          <p className="mt-5 text-sm leading-7 text-slate-700">{shortDescription(product)}</p>

          <Link href={`/go/${product.slug}`} className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-[#ffd814] px-5 text-base font-black text-slate-950 transition hover:bg-[#f7ca00]">
            Ver precio y comprar
          </Link>
          <p className="mt-3 text-center text-xs text-slate-500">La compra se completa en el proveedor oficial.</p>

          <div className="mt-6 grid gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">Pago seguro al finalizar la compra</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">Producto disponible online</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">URL publica para compartir: {publicUrl.replace("https://", "")}</div>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Descripcion del producto</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-700">{cleanPublicText(product.ai_review, shortDescription(product))}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Detalles rapidos</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span>Categoria</span><strong>{product.category || "General"}</strong></div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span>Proveedor</span><strong>{platformLabel(product.platform)}</strong></div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span>Estado</span><strong>Disponible</strong></div>
              <div className="flex justify-between gap-4"><span>Moneda</span><strong>{product.currency}</strong></div>
            </div>
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-5">
            <h2 className="text-2xl font-black">Tambien te puede interesar</h2>
            <p className="mt-1 text-sm text-slate-600">Mas productos relacionados disponibles en la tienda.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => <MiniProductCard key={item.id} product={item} />)}
          </div>
        </section>
      ) : null}

      <footer className="mt-10 bg-[#06172f] px-4 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="inline-flex rounded-lg bg-white px-3 py-2"><StoreLogo className="h-14 w-auto" /></div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">Algunos enlaces pueden generar una comision sin coste adicional para el comprador. Para pagos, envios y devoluciones se aplican las condiciones del proveedor donde finalizas la compra.</p>
        </div>
      </footer>
    </main>
  );
}
