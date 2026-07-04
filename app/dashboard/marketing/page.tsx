import { getAdminDb } from "@/lib/supabase";
import { money } from "@/lib/utils";
import type { AffiliateProduct } from "@/types";
import type { MarketingContent, MetaCampaign, PublishLog } from "@/lib/marketing/types";

async function getMarketingData() {
  try {
    const db = getAdminDb();
    const [products, contents, logs, campaigns] = await Promise.all([
      db.select<AffiliateProduct>("affiliate_products", { select: "*", order: "created_at.desc", limit: "30" }),
      db.select<MarketingContent>("marketing_content", { select: "*" }),
      db.select<PublishLog>("publish_log", { select: "*", order: "published_at.desc", limit: "80" }),
      db.select<MetaCampaign>("meta_campaigns", { select: "*", order: "created_at.desc", limit: "20" }),
    ]);
    return { products, contents, logs, campaigns };
  } catch {
    return { products: [], contents: [], logs: [], campaigns: [] };
  }
}

function statusLabel(status?: string) {
  if (!status) return "pending";
  return status;
}

export default async function MarketingPage() {
  const { products, contents, logs, campaigns } = await getMarketingData();
  const contentMap = new Map(contents.map((item) => [item.product_id, item]));
  const today = new Date().toISOString().slice(0, 10);
  const postsToday = logs.filter((item) => item.status === "success" && item.published_at?.startsWith(today)).length;
  const totalSpent = campaigns.reduce((sum, item) => sum + Number(item.total_spent || 0), 0);
  const reach = campaigns.reduce((sum, item) => sum + Number(item.total_impressions || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Marketing automatizado</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Contenido IA, publicaciones sociales y promocion Meta Ads para los productos que salen a la venta.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a className="btn" href="/dashboard/marketing/social-accounts">Cuentas sociales</a>
          <a className="btn btn-primary" href="/dashboard/marketing/meta-ads">Meta Ads</a>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Posts publicados hoy</div><div className="mt-2 font-mono text-3xl">{postsToday}</div></div>
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Gasto Meta registrado</div><div className="mt-2 font-mono text-3xl">{money(totalSpent, "EUR")}</div></div>
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Alcance total</div><div className="mt-2 font-mono text-3xl">{reach}</div></div>
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <h2 className="font-display text-xl font-bold">Productos y publicidad</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[var(--bg-elevated)] text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-5 py-3">Producto</th>
                <th className="px-5 py-3">Estado contenido</th>
                <th className="px-5 py-3">Prioridad</th>
                <th className="px-5 py-3">Publicar</th>
                <th className="px-5 py-3">Meta Ads</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const content = contentMap.get(product.id);
                return (
                  <tr key={product.id} className="border-t border-[var(--border)]">
                    <td className="px-5 py-4">
                      <div className="font-semibold">{product.ai_title || product.title}</div>
                      <div className="text-xs text-[var(--text-muted)]">{product.platform} · {money(product.price, product.currency)}</div>
                    </td>
                    <td className="px-5 py-4">{statusLabel(content?.content_status)}</td>
                    <td className="px-5 py-4 font-mono">{content?.priority_score ?? "-"}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <form action="/api/marketing/generate-content" method="post">
                          <input type="hidden" name="productId" value={product.id} />
                          <button className="btn" type="submit">Generar IA</button>
                        </form>
                        <form action="/api/marketing/publish" method="post">
                          <input type="hidden" name="productId" value={product.id} />
                          <button className="btn btn-primary" type="submit">Publicar ahora</button>
                        </form>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <form action="/api/marketing/meta/create-campaign" method="post" className="flex gap-2">
                        <input type="hidden" name="productId" value={product.id} />
                        <input className="input max-w-24" name="budget" type="number" min="1" step="1" defaultValue="50" />
                        <button className="btn" type="submit">Crear anuncio</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {!products.length ? <tr><td className="px-5 py-8 text-center text-[var(--text-secondary)]" colSpan={5}>No hay productos para promocionar.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
