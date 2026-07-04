import Image from "next/image";
import Link from "next/link";
import { getAdminDb } from "@/lib/supabase";
import { money } from "@/lib/utils";
import type { AffiliatePartnerProduct, AffiliatePartnerPublic } from "@/types";

async function getStore(storeSlug: string) {
  try {
    const db = getAdminDb();
    const partner = (await db.select<AffiliatePartnerPublic>("affiliate_partners", {
      select: "id,email,full_name,brand_name,store_slug,website_url,payout_email,affiliate_commission_rate,owner_commission_rate,status,created_at",
      store_slug: `eq.${storeSlug}`,
      status: "eq.active",
      limit: "1",
    }))[0];
    if (!partner) return null;
    const products = await db.select<AffiliatePartnerProduct>("affiliate_partner_products", {
      select: "*",
      partner_id: `eq.${partner.id}`,
      is_active: "eq.true",
      order: "created_at.desc",
    });
    return { partner, products };
  } catch {
    return null;
  }
}

export default async function AffiliateStorePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const store = await getStore(storeSlug);
  if (!store) return <main className="p-8">Tienda de afiliado no encontrada.</main>;

  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-5 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div>
            <h1 className="font-display text-4xl font-extrabold">{store.partner.brand_name}</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Productos seleccionados por esta web afiliada.</p>
          </div>
          {store.partner.website_url ? <Link className="btn" href={store.partner.website_url}>Web principal</Link> : null}
        </header>

        {store.products.length ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {store.products.map((product) => (
              <article key={product.id} className="surface overflow-hidden">
                <div className="aspect-[4/3] bg-[var(--bg-elevated)]">
                  {product.image_url ? <Image src={product.image_url} alt={product.title} width={640} height={480} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="p-4">
                  <div className="font-mono text-xs uppercase text-[var(--accent-gold)]">{product.category || "producto"}</div>
                  <h2 className="mt-2 line-clamp-2 min-h-12 font-display text-lg font-bold">{product.title}</h2>
                  <div className="mt-3 font-mono text-xl text-[var(--accent-green)]">{money(product.price, product.currency)}</div>
                  <Link className="btn btn-primary mt-4 w-full" href={`/a/${store.partner.store_slug}/${product.slug}`}>Ver producto</Link>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="surface p-8 text-center text-[var(--text-secondary)]">Esta tienda todavia no tiene productos publicados.</section>
        )}
      </div>
    </main>
  );
}
