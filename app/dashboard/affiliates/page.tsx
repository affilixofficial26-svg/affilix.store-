import Link from "next/link";
import { getAdminDb } from "@/lib/supabase";
import { money } from "@/lib/utils";
import type { AffiliatePartnerCommission, AffiliatePartnerProduct, AffiliatePartnerPromotion, AffiliatePartnerPublic } from "@/types";

async function getAffiliates() {
  try {
    const db = getAdminDb();
    const [partners, commissions, products, promotions] = await Promise.all([
      db.select<AffiliatePartnerPublic>("affiliate_partners", { select: "id,email,full_name,brand_name,store_slug,website_url,payout_email,custom_domain,domain_status,domain_notes,promotion_goal_clicks,promotion_goal_sales,promotion_goal_revenue,account_close_requested_at,affiliate_commission_rate,owner_commission_rate,status,created_at", order: "created_at.desc" }),
      db.select<AffiliatePartnerCommission>("affiliate_partner_commissions", { select: "*" }),
      db.select<AffiliatePartnerProduct>("affiliate_partner_products", { select: "*" }),
      db.select<AffiliatePartnerPromotion>("affiliate_partner_promotions", { select: "*" }),
    ]);

    return partners.map((partner) => {
      const ownCommissions = commissions.filter((commission) => commission.partner_id === partner.id);
      const ownProducts = products.filter((product) => product.partner_id === partner.id);
      const ownPromotions = promotions.filter((promotion) => promotion.partner_id === partner.id);
      const productClicks = ownProducts.reduce((sum, item) => sum + Number(item.total_clicks || 0), 0);
      const promotionClicks = ownPromotions.reduce((sum, item) => sum + Number(item.total_clicks || 0), 0);
      return {
        ...partner,
        sales: ownCommissions.length,
        grossSales: ownCommissions.reduce((sum, item) => sum + Number(item.gross_sale_amount || 0), 0),
        affiliateTotal: ownCommissions.reduce((sum, item) => sum + Number(item.affiliate_commission_amount || 0), 0),
        ownerTotal: ownCommissions.reduce((sum, item) => sum + Number(item.owner_commission_amount || 0), 0),
        productClicks,
        promotionClicks,
        totalClicks: productClicks + promotionClicks,
      };
    });
  } catch {
    return [];
  }
}

const affiliateMessages: Record<string, { tone: string; text: string }> = {
  created: { tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200", text: "Afiliado creado correctamente." },
  "status-ok": { tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200", text: "Estado del afiliado actualizado." },
  "invalid-email": { tone: "border-red-500/40 bg-red-500/10 text-red-200", text: "Correo de afiliado invalido." },
  "invalid-password": { tone: "border-red-500/40 bg-red-500/10 text-red-200", text: "La contrasena debe tener minimo 8 caracteres." },
  "missing-fields": { tone: "border-red-500/40 bg-red-500/10 text-red-200", text: "Nombre, marca y slug son obligatorios." },
  "invalid-rate": { tone: "border-red-500/40 bg-red-500/10 text-red-200", text: "El reparto de comision no puede superar el 100%." },
  "invalid-status": { tone: "border-red-500/40 bg-red-500/10 text-red-200", text: "Estado de afiliado invalido." },
};

export default async function AdminAffiliatesPage({ searchParams }: { searchParams?: Promise<{ affiliates?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const message = params.affiliates ? affiliateMessages[params.affiliates] : null;
  const affiliates = await getAffiliates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Afiliados</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Accesos separados para afiliados. Tu panel admin queda protegido en /dashboard; ellos solo entran a su dashboard afiliado.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="btn" href="/affiliate/login">Probar login afiliado</Link>
        </div>
      </div>

      {message ? <div className={`rounded-xl border px-4 py-3 text-sm ${message.tone}`}>{message.text}</div> : null}

      <section className="surface p-5">
        <h2 className="font-display text-xl font-bold">Crear acceso de afiliado</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Al crear este acceso, el afiliado recibe su propio dashboard privado. No puede entrar al panel administrador con estas credenciales.
        </p>
        <form action="/api/admin/affiliates" method="post" className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input className="input" name="full_name" placeholder="Nombre del afiliado" required />
          <input className="input" name="email" type="email" placeholder="Correo de acceso" required />
          <input className="input" name="password" type="password" placeholder="Contrasena inicial" minLength={8} required />
          <input className="input" name="brand_name" placeholder="Nombre de su web/marca" required />
          <input className="input" name="store_slug" placeholder="slug-publico-ejemplo" required />
          <input className="input" name="website_url" placeholder="https://suweb.com" />
          <input className="input" name="payout_email" type="email" placeholder="Correo de pago" />
          <input className="input" name="affiliate_commission_rate" type="number" min="0" max="100" step="0.01" defaultValue="80" />
          <input className="input" name="owner_commission_rate" type="number" min="0" max="100" step="0.01" defaultValue="20" />
          <button className="btn btn-primary md:col-span-2 xl:col-span-3" type="submit">Crear afiliado</button>
        </form>
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <h2 className="font-display text-xl font-bold">Afiliados activos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-[var(--bg-elevated)] text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-5 py-3">Afiliado</th>
                <th className="px-5 py-3">Tienda</th>
                <th className="px-5 py-3">Reparto</th>
                <th className="px-5 py-3">Clicks</th>
                <th className="px-5 py-3">Ventas</th>
                <th className="px-5 py-3">Afiliado</th>
                <th className="px-5 py-3">AFFILIX</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Control</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((affiliate) => (
                <tr key={affiliate.id} className="border-t border-[var(--border)]">
                  <td className="px-5 py-4">
                    <div className="font-semibold">{affiliate.full_name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{affiliate.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <Link className="font-semibold text-[var(--accent-gold)]" href={`/a/${affiliate.store_slug}`}>{affiliate.brand_name}</Link>
                    <div className="text-xs text-[var(--text-muted)]">/a/{affiliate.store_slug}</div>
                    {affiliate.custom_domain ? <div className="text-xs text-[var(--text-muted)]">{affiliate.custom_domain} · {affiliate.domain_status}</div> : null}
                  </td>
                  <td className="px-5 py-4">{Number(affiliate.affiliate_commission_rate)}% / {Number(affiliate.owner_commission_rate)}%</td>
                  <td className="px-5 py-4">
                    <div>{affiliate.totalClicks}</div>
                    <div className="text-xs text-[var(--text-muted)]">Web: {affiliate.productClicks} · AFFILIX: {affiliate.promotionClicks}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div>{affiliate.sales}</div>
                    <div className="text-xs text-[var(--text-muted)]">{money(affiliate.grossSales)} bruto</div>
                  </td>
                  <td className="px-5 py-4">{money(affiliate.affiliateTotal)}</td>
                  <td className="px-5 py-4">{money(affiliate.ownerTotal)}</td>
                  <td className="px-5 py-4">
                    <div>{affiliate.status}</div>
                    {affiliate.account_close_requested_at ? <div className="text-xs text-red-300">Cierre solicitado</div> : null}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {affiliate.status !== "active" ? (
                        <form action="/api/admin/affiliates" method="post">
                          <input type="hidden" name="action" value="status" />
                          <input type="hidden" name="id" value={affiliate.id} />
                          <input type="hidden" name="status" value="active" />
                          <button className="btn" type="submit">Activar</button>
                        </form>
                      ) : null}
                      {affiliate.status !== "paused" ? (
                        <form action="/api/admin/affiliates" method="post">
                          <input type="hidden" name="action" value="status" />
                          <input type="hidden" name="id" value={affiliate.id} />
                          <input type="hidden" name="status" value="paused" />
                          <button className="btn" type="submit">Pausar</button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!affiliates.length ? (
                <tr>
                  <td className="px-5 py-8 text-center text-[var(--text-secondary)]" colSpan={9}>Todavia no hay afiliados creados.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
