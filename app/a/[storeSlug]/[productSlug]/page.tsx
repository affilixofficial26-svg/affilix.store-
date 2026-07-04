import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAdminDb } from "@/lib/supabase";
import { money } from "@/lib/utils";
import type { AffiliatePartnerProduct, AffiliatePartnerPublic } from "@/types";

async function getAffiliateProduct(storeSlug: string, productSlug: string) {
  try {
    const db = getAdminDb();
    const partner = (await db.select<AffiliatePartnerPublic>("affiliate_partners", {
      select: "id,email,full_name,brand_name,store_slug,website_url,payout_email,affiliate_commission_rate,owner_commission_rate,status,created_at",
      store_slug: `eq.${storeSlug}`,
      status: "eq.active",
      limit: "1",
    }))[0];
    if (!partner) return null;
    const product = (await db.select<AffiliatePartnerProduct>("affiliate_partner_products", {
      select: "*",
      partner_id: `eq.${partner.id}`,
      slug: `eq.${productSlug}`,
      is_active: "eq.true",
      limit: "1",
    }))[0];
    return product ? { partner, product } : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string; productSlug: string }> }): Promise<Metadata> {
  const { storeSlug, productSlug } = await params;
  const data = await getAffiliateProduct(storeSlug, productSlug);
  return {
    title: data?.product.seo_title || data?.product.title || "Producto afiliado",
    description: data?.product.seo_description || data?.product.description || "Producto publicado por afiliado",
  };
}

export default async function AffiliateProductPage({ params }: { params: Promise<{ storeSlug: string; productSlug: string }> }) {
  const { storeSlug, productSlug } = await params;
  const data = await getAffiliateProduct(storeSlug, productSlug);
  if (!data) return <main className="p-8">Producto no encontrado.</main>;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.product.title,
    image: data.product.image_url,
    description: data.product.description,
    offers: { "@type": "Offer", price: data.product.price, priceCurrency: data.product.currency },
  };

  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-5 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="surface overflow-hidden">
          {data.product.image_url ? <Image src={data.product.image_url} alt={data.product.title} width={900} height={900} className="w-full object-cover" /> : <div className="aspect-square" />}
        </div>
        <section className="surface p-6">
          <Link href={`/a/${data.partner.store_slug}`} className="font-mono text-xs uppercase text-[var(--accent-gold)]">{data.partner.brand_name}</Link>
          <h1 className="font-display mt-2 text-4xl font-extrabold">{data.product.title}</h1>
          <div className="mt-4 font-mono text-3xl text-[var(--accent-green)]">{money(data.product.price, data.product.currency)}</div>
          <p className="mt-5 whitespace-pre-line text-[var(--text-secondary)]">{data.product.description}</p>
          <Link href={`/a/go/${data.partner.store_slug}/${data.product.slug}`} className="btn btn-primary mt-6 w-full">Comprar ahora</Link>
          <p className="mt-6 text-xs text-[var(--text-muted)]">Esta web puede recibir comisiones por compras realizadas mediante enlaces de afiliado. AFFILIX conserva una parte pequena de la comision registrada.</p>
        </section>
      </div>
    </main>
  );
}
