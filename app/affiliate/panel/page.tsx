import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAffiliatePartner } from "@/lib/affiliate-auth";
import { getStoreBaseUrl } from "@/lib/store-links";
import { getAdminDb } from "@/lib/supabase";
import { money, slugify } from "@/lib/utils";
import type { AffiliatePartnerCommission, AffiliatePartnerProduct, AffiliatePartnerPromotion, AffiliateProduct, Platform, PlatformAccount } from "@/types";

type MainAffiliateProduct = AffiliateProduct & { total_clicks?: number | null; sales_count?: number; created_at?: string | null };
type PanelParams = { q?: string; categoria?: string; proveedor?: string; orden?: string; promotion?: string; product?: string; settings?: string; close?: string; meta?: string; message?: string };
type AffiliateMetaPromotion = {
  id: string;
  partner_id: string;
  source_product_id: string;
  meta_account_mode: "affilix_main" | "affiliate_own";
  budget_amount: number | string;
  currency: string;
  destination_url: string;
  campaign_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};
type AffiliateMetaAccount = { id: string; connected: boolean; ad_account_id: string | null; page_id: string | null };
type AffiliateNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

async function safeSelect<T>(table: string, query: Record<string, string>) {
  try {
    return await getAdminDb().select<T>(table, query);
  } catch {
    return [];
  }
}

async function getAffiliatePanelData(partnerId: string) {
  const db = getAdminDb();
  const [ownProducts, commissions, promotions, mainProducts, connectedAccounts, metaPromotions, ownMetaAccounts, notifications] = await Promise.all([
    db.select<AffiliatePartnerProduct>("affiliate_partner_products", { select: "*", partner_id: `eq.${partnerId}`, order: "created_at.desc" }),
    db.select<AffiliatePartnerCommission>("affiliate_partner_commissions", { select: "*", partner_id: `eq.${partnerId}`, order: "earned_at.desc" }),
    db.select<AffiliatePartnerPromotion>("affiliate_partner_promotions", { select: "*", partner_id: `eq.${partnerId}`, order: "updated_at.desc", limit: "120" }),
    db.select<MainAffiliateProduct>("affiliate_products", { select: "*", is_active: "eq.true", image_url: "not.is.null", order: "created_at.desc", limit: "180" }),
    safeSelect<PlatformAccount>("platform_accounts", {
      select: "platform,connected,last_test_status",
      user_id: "is.null",
      connected: "eq.true",
      last_test_status: "eq.success",
    }),
    safeSelect<AffiliateMetaPromotion>("affiliate_meta_promotions", { select: "*", partner_id: `eq.${partnerId}`, order: "created_at.desc", limit: "50" }),
    safeSelect<AffiliateMetaAccount>("affiliate_meta_accounts", { select: "id,connected,ad_account_id,page_id", partner_id: `eq.${partnerId}`, limit: "1" }),
    safeSelect<AffiliateNotification>("affiliate_notifications", { select: "*", partner_id: `eq.${partnerId}`, order: "created_at.desc", limit: "50" }),
  ]);

  const saleRows = await safeSelect<{ product_id: string | null }>("commissions", { select: "product_id", status: "neq.rejected" });
  const salesByProductId = new Map<string, number>();
  saleRows.forEach((row) => {
    if (row.product_id) salesByProductId.set(row.product_id, (salesByProductId.get(row.product_id) || 0) + 1);
  });

  const connectedPlatforms = new Set(connectedAccounts.map((account) => account.platform));
  const connectedMainProducts = mainProducts
    .filter((product) => connectedPlatforms.has(product.platform))
    .map((product) => ({ ...product, sales_count: salesByProductId.get(product.id) || 0 }));

  return { ownProducts, commissions, promotions, mainProducts: connectedMainProducts, connectedPlatforms, metaPromotions, ownMetaAccount: ownMetaAccounts[0] || null, notifications };
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function platformLabel(platform: Platform | string) {
  return String(platform).replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function publicProductText(value: string | null | undefined) {
  return (value || "")
    .replace(/\bMuAPI\b/gi, "proceso interno")
    .replace(/\bIA\b/gi, "")
    .replace(/\bAI\b/gi, "")
    .replace(/\bAPI\b/gi, "conexion")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function productScore(product: MainAffiliateProduct) {
  const clicks = Number(product.total_clicks || 0) * 3;
  const sales = Number(product.sales_count || 0) * 24;
  const reviews = Math.min(Number(product.review_count || 0) / 80, 35);
  const rating = Number(product.rating || 0) * 4;
  const commission = Number(product.commission_rate || 0) * 1.2 + Math.min(Number(product.commission_amount || 0), 50);
  return clicks + sales + reviews + rating + commission;
}

function productMatches(product: MainAffiliateProduct, query: string, category: string, provider: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const haystack = normalize([
    product.title,
    product.ai_title,
    product.description,
    product.ai_description,
    product.category,
    product.platform,
    platformLabel(product.platform),
    ...(product.tags || []),
  ].filter(Boolean).join(" "));
  const matchesSearch = terms.length ? terms.every((term) => haystack.includes(term)) : true;
  const matchesCategory = category ? slugify(product.category || "") === category : true;
  const matchesProvider = provider ? product.platform === provider : true;
  return matchesSearch && matchesCategory && matchesProvider;
}

function sortProducts(products: MainAffiliateProduct[], order: string) {
  const list = [...products];
  if (order === "vistos") return list.sort((a, b) => Number(b.total_clicks || 0) - Number(a.total_clicks || 0));
  if (order === "vendidos") return list.sort((a, b) => Number(b.sales_count || 0) - Number(a.sales_count || 0));
  if (order === "comision") return list.sort((a, b) => Number(b.commission_rate || b.commission_amount || 0) - Number(a.commission_rate || a.commission_amount || 0));
  if (order === "nuevos") return list.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  return list.sort((a, b) => productScore(b) - productScore(a));
}

function buildCategories(products: MainAffiliateProduct[]) {
  const counts = new Map<string, number>();
  products.forEach((product) => {
    if (product.category) counts.set(product.category, (counts.get(product.category) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count, slug: slugify(name) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function buildProviders(products: MainAffiliateProduct[]) {
  const counts = new Map<string, number>();
  products.forEach((product) => counts.set(product.platform, (counts.get(product.platform) || 0) + 1));
  return Array.from(counts.entries())
    .map(([platform, count]) => ({ platform, count, name: platformLabel(platform) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function filterHref(params: PanelParams, patch: Partial<PanelParams>) {
  const next = new URLSearchParams();
  const values = { ...params, ...patch };
  Object.entries(values).forEach(([key, value]) => {
    if (value) next.set(key, String(value));
  });
  const query = next.toString();
  return `/affiliate/panel${query ? `?${query}` : ""}`;
}

function mainPromotionUrl(storeSlug: string, productSlug: string) {
  return `${getStoreBaseUrl()}/a/go/${storeSlug}/main/${productSlug}`;
}

function affiliateSiteUrl(partner: { store_slug: string; website_url?: string | null; custom_domain?: string | null; domain_status?: string | null }) {
  if (partner.website_url) return partner.website_url;
  if (partner.custom_domain && partner.domain_status === "connected") return `https://${partner.custom_domain}`;
  return `/a/${partner.store_slug}`;
}

function progressValue(current: number, goal: number) {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}

function notificationTone(type: string) {
  if (type.includes("sale")) return "bg-emerald-500/15 text-emerald-300";
  if (type.includes("click")) return "bg-sky-500/15 text-sky-300";
  if (type.includes("login")) return "bg-purple-500/15 text-purple-300";
  if (type.includes("meta")) return "bg-amber-500/15 text-amber-200";
  return "bg-white/10 text-[var(--text-secondary)]";
}

const messages: Record<string, { tone: string; text: string }> = {
  ready: { tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200", text: "Producto publicado en la web principal con tu enlace afiliado." },
  "published-own": { tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200", text: "Producto publicado o actualizado en tu web afiliada." },
  provider: { tone: "border-amber-500/40 bg-amber-500/10 text-amber-100", text: "Ese producto pertenece a una plataforma que no esta conectada en el panel principal." },
  missing: { tone: "border-red-500/40 bg-red-500/10 text-red-200", text: "Ese producto ya no esta disponible." },
  ok: { tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200", text: "Ajustes guardados correctamente." },
  "close-missing": { tone: "border-red-500/40 bg-red-500/10 text-red-200", text: "Para cerrar la cuenta debes confirmar y seleccionar un motivo." },
  "meta-ready": { tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200", text: "Promocion Meta creada en estado pausado para revisar antes de gastar." },
  "meta-invalid": { tone: "border-red-500/40 bg-red-500/10 text-red-200", text: "Faltan datos para crear la promocion Meta." },
  "meta-error": { tone: "border-red-500/40 bg-red-500/10 text-red-200", text: "No se pudo crear la promocion Meta." },
};

export default async function AffiliatePanelPage({ searchParams }: { searchParams?: Promise<PanelParams> }) {
  const partner = await getCurrentAffiliatePartner();
  if (!partner) redirect("/affiliate/login");

  const params = (await searchParams) || {};
  const { ownProducts, commissions, promotions, mainProducts, metaPromotions, ownMetaAccount, notifications } = await getAffiliatePanelData(partner.id);
  const ownProductById = new Map(ownProducts.map((product) => [product.id, product]));
  const mainProductById = new Map(mainProducts.map((product) => [product.id, product]));
  const promotionByProductId = new Map(promotions.map((promotion) => [promotion.source_product_id, promotion]));
  const ownProductBySourceId = new Map(ownProducts.filter((product) => product.source_product_id).map((product) => [product.source_product_id, product]));
  const categories = buildCategories(mainProducts);
  const providers = buildProviders(mainProducts);
  const hasActiveFilter = Boolean(params.q || params.categoria || params.proveedor || params.orden);
  const filteredProducts = sortProducts(
    mainProducts.filter((product) => productMatches(product, params.q || "", params.categoria || "", params.proveedor || "")),
    params.orden || "rentables",
  );
  const catalogProducts = hasActiveFilter ? filteredProducts.slice(0, 60) : filteredProducts.slice(0, 20);
  const localClicks = ownProducts.reduce((sum, product) => sum + Number(product.total_clicks || 0), 0);
  const mainClicks = promotions.reduce((sum, promotion) => sum + Number(promotion.total_clicks || 0), 0);
  const totalClicks = localClicks + mainClicks;
  const sales = commissions.length;
  const grossSales = commissions.reduce((sum, item) => sum + Number(item.gross_sale_amount || 0), 0);
  const totalCommission = commissions.reduce((sum, item) => sum + Number(item.total_commission_amount || 0), 0);
  const affiliatePending = commissions.filter((item) => item.status === "pending").reduce((sum, item) => sum + Number(item.affiliate_commission_amount || 0), 0);
  const affiliateApproved = commissions.filter((item) => item.status === "approved").reduce((sum, item) => sum + Number(item.affiliate_commission_amount || 0), 0);
  const clickGoal = Number(partner.promotion_goal_clicks || 0);
  const salesGoal = Number(partner.promotion_goal_sales || 0);
  const revenueGoal = Number(partner.promotion_goal_revenue || 0);
  const messageKey = params.promotion || params.product || params.settings || (params.close === "missing" ? "close-missing" : "") || (params.meta ? `meta-${params.meta}` : "");
  const message = messageKey ? messages[messageKey] : null;
  const mainStoreUrl = "https://affilix.store/productos";
  const ownSiteUrl = affiliateSiteUrl(partner);

  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-4 py-6 lg:px-6">
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="surface top-6 h-fit p-4 lg:sticky">
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
            <img className="h-14 w-14 rounded-full object-cover" src="/affilix-partners-logo.png" alt="AFFILIX Partners" />
            <div>
              <div className="font-display text-base font-bold">AFFILIX Partners</div>
              <div className="text-xs text-[var(--text-secondary)]">{partner.brand_name}</div>
            </div>
          </div>
          <nav className="mt-4 grid gap-2 text-sm">
            <a className="rounded-lg px-3 py-2 hover:bg-[var(--bg-elevated)]" href="#dashboard">Dashboard</a>
            <a className="rounded-lg px-3 py-2 hover:bg-[var(--bg-elevated)]" href="#notificaciones">Notificaciones</a>
            <a className="rounded-lg px-3 py-2 hover:bg-[var(--bg-elevated)]" href="#ventas">Ventas</a>
            <a className="rounded-lg px-3 py-2 hover:bg-[var(--bg-elevated)]" href="#publicaciones">Publicaciones</a>
            <a className="rounded-lg px-3 py-2 hover:bg-[var(--bg-elevated)]" href="#promociones-meta">Promociones Meta</a>
            <a className="rounded-lg px-3 py-2 hover:bg-[var(--bg-elevated)]" href="#productos-publicados">Productos publicados</a>
            <a className="rounded-lg px-3 py-2 hover:bg-[var(--bg-elevated)]" href="#pagina-web">Pagina web</a>
            <a className="rounded-lg px-3 py-2 hover:bg-[var(--bg-elevated)]" href="#analitica">Analitica</a>
            <a className="rounded-lg px-3 py-2 hover:bg-[var(--bg-elevated)]" href="#ajustes">Ajustes</a>
          </nav>
          <div className="mt-4 grid gap-2">
            <Link className="btn btn-primary w-full" href={mainStoreUrl}>Web principal AFFILIX</Link>
            <Link className="btn w-full" href={ownSiteUrl}>Mi web afiliada</Link>
            <form action="/api/affiliate/auth/logout" method="post">
              <button className="btn w-full" type="submit">Salir</button>
            </form>
          </div>
        </aside>

        <div className="space-y-6">
          <header id="dashboard" className="surface overflow-hidden">
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_220px]">
              <div>
                <div className="font-mono text-xs uppercase text-[var(--accent-gold)]">Panel de afiliado</div>
                <h1 className="font-display mt-2 text-3xl font-bold">Dashboard de {partner.brand_name}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                  Controla tus ventas, publicaciones, productos, web propia, enlaces para la web principal y ajustes de cuenta desde un panel ordenado.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link className="btn btn-primary" href={mainStoreUrl}>Abrir web principal AFFILIX</Link>
                  <Link className="btn" href={ownSiteUrl}>Abrir mi web afiliada</Link>
                </div>
              </div>
              <img className="mx-auto h-44 w-44 rounded-full object-cover shadow-2xl shadow-black/40" src="/affilix-partners-logo.png" alt="AFFILIX Partners" />
            </div>
          </header>

          {message ? <div className={`rounded-xl border px-4 py-3 text-sm ${message.tone}`}>{message.text}</div> : null}

          <section className="grid gap-4 md:grid-cols-4">
            <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Ventas</div><div className="mt-2 font-mono text-3xl">{sales}</div></div>
            <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Mi comision</div><div className="mt-2 font-mono text-3xl">{money(affiliatePending + affiliateApproved)}</div></div>
            <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Clicks</div><div className="mt-2 font-mono text-3xl">{totalClicks}</div></div>
            <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Productos web propia</div><div className="mt-2 font-mono text-3xl">{ownProducts.length}</div></div>
          </section>

          <section id="notificaciones" className="surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5">
              <div>
                <h2 className="font-display text-xl font-bold">Panel de notificaciones</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Avisos de tu cuenta: ventas, clicks, accesos, promociones y cambios importantes.</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-sm">{notifications.filter((item) => !item.read).length} sin leer</div>
            </div>
            {notifications.length ? (
              <div className="divide-y divide-[var(--border)]">
                {notifications.slice(0, 12).map((item) => (
                  <article key={item.id} className="grid gap-3 p-4 md:grid-cols-[120px_1fr_160px]">
                    <div><span className={`rounded-full px-3 py-1 text-xs font-bold ${notificationTone(item.type)}`}>{item.type.replace(/[_-]/g, " ")}</span></div>
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.message}</p>
                    </div>
                    <div className="font-mono text-xs text-[var(--text-muted)]">{new Date(item.created_at).toLocaleString("es-ES")}</div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Todavia no tienes notificaciones.</div>
            )}
          </section>

          <section id="ventas" className="surface overflow-hidden">
            <div className="border-b border-[var(--border)] p-5">
              <h2 className="font-display text-xl font-bold">Panel de ventas</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Resumen de ventas, comisiones pendientes y comisiones aprobadas.</p>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-4">
              <div className="rounded-xl bg-[var(--bg-elevated)] p-4"><div className="text-xs text-[var(--text-muted)]">Venta bruta</div><div className="mt-2 font-mono text-2xl">{money(grossSales)}</div></div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-4"><div className="text-xs text-[var(--text-muted)]">Comision total</div><div className="mt-2 font-mono text-2xl">{money(totalCommission)}</div></div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-4"><div className="text-xs text-[var(--text-muted)]">Pendiente</div><div className="mt-2 font-mono text-2xl">{money(affiliatePending)}</div></div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-4"><div className="text-xs text-[var(--text-muted)]">Aprobada</div><div className="mt-2 font-mono text-2xl">{money(affiliateApproved)}</div></div>
            </div>
          </section>

          <section id="publicaciones" className="surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">Panel de publicaciones</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                  Usa productos de plataformas conectadas en el panel principal. Puedes publicarlos en la web principal AFFILIX o copiarlos a tu web afiliada.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-right">
                <div className="text-[10px] uppercase tracking-[.14em] text-[var(--text-muted)]">Top inicial</div>
                <div className="font-mono text-sm text-white">{catalogProducts.length} productos</div>
              </div>
            </div>

            <form className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_.8fr_.8fr_.7fr_auto]" action="/affiliate/panel" method="get">
              <input className="input" name="q" defaultValue={params.q || ""} placeholder="Buscar por grupo: mascotas, digital, hogar, software..." />
              <select className="input" name="categoria" defaultValue={params.categoria || ""}>
                <option value="">Todas las categorias</option>
                {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
              </select>
              <select className="input" name="proveedor" defaultValue={params.proveedor || ""}>
                <option value="">Todas las plataformas</option>
                {providers.map((provider) => <option key={provider.platform} value={provider.platform}>{provider.name}</option>)}
              </select>
              <select className="input" name="orden" defaultValue={params.orden || "rentables"}>
                <option value="rentables">Mas rentables</option>
                <option value="vistos">Mas vistos</option>
                <option value="vendidos">Mas vendidos</option>
                <option value="comision">Mayor comision</option>
                <option value="nuevos">Nuevos</option>
              </select>
              <button className="btn btn-primary" type="submit">Buscar</button>
            </form>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              <Link className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${!params.categoria ? "bg-[var(--accent-gold)] text-black" : "bg-[var(--bg-input)] text-[var(--text-secondary)]"}`} href={filterHref(params, { categoria: undefined })}>Todos</Link>
              {categories.slice(0, 12).map((category) => (
                <Link key={category.slug} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${params.categoria === category.slug ? "bg-[var(--accent-gold)] text-black" : "bg-[var(--bg-input)] text-[var(--text-secondary)]"}`} href={filterHref(params, { categoria: category.slug })}>
                  {category.name} ({category.count})
                </Link>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {catalogProducts.map((product) => {
                const promotion = promotionByProductId.get(product.id);
                const ownProduct = ownProductBySourceId.get(product.id);
                const mainLink = mainPromotionUrl(partner.store_slug, product.slug);
                return (
                  <article key={product.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
                    <div className="aspect-[4/3] bg-[var(--bg-input)]">
                      <img className="h-full w-full object-cover" src={product.image_url || "/placeholder-product.svg"} alt={publicProductText(product.title)} />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-[.14em] text-[var(--accent-gold)]">{platformLabel(product.platform)}</span>
                        <span className="rounded-full bg-[var(--bg-input)] px-2 py-1 text-[10px] text-[var(--text-secondary)]">{product.category || "Producto"}</span>
                      </div>
                      <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-bold leading-5">{publicProductText(product.title)}</h3>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-[var(--text-secondary)]">
                        <div className="rounded-lg bg-[var(--bg-input)] p-2"><div className="font-mono text-white">{Number(product.total_clicks || 0)}</div><div>vistas</div></div>
                        <div className="rounded-lg bg-[var(--bg-input)] p-2"><div className="font-mono text-white">{Number(product.sales_count || 0)}</div><div>ventas</div></div>
                        <div className="rounded-lg bg-[var(--bg-input)] p-2"><div className="font-mono text-white">{Number(product.commission_rate || 0)}%</div><div>com.</div></div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span className="font-mono text-[var(--accent-green)]">{money(product.price, product.currency)}</span>
                        <span className="text-xs text-[var(--text-secondary)]">{promotion ? `${promotion.total_clicks} clicks web principal` : "Sin enlace principal"}</span>
                      </div>
                      {promotion ? <div className="mt-3 break-all rounded-lg bg-[var(--bg-input)] p-3 font-mono text-[11px] text-[var(--text-secondary)]">{mainLink}</div> : null}
                      <div className="mt-3 grid gap-2">
                        <form action="/api/affiliate/promotions" method="post">
                          <input type="hidden" name="source_product_id" value={product.id} />
                          <button className="btn btn-primary w-full" type="submit">{promotion ? "Actualizar web principal" : "Publicar en web principal"}</button>
                        </form>
                        <form action="/api/affiliate/products" method="post">
                          <input type="hidden" name="source_product_id" value={product.id} />
                          <button className="btn w-full" type="submit">{ownProduct ? "Actualizar mi web" : "Publicar en mi web"}</button>
                        </form>
                        {ownProduct ? <Link className="btn w-full" href={`/a/${partner.store_slug}/${ownProduct.slug}`}>Ver en mi web</Link> : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {!catalogProducts.length ? (
              <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center text-sm text-[var(--text-secondary)]">
                No hay productos disponibles con esos filtros o no hay plataformas conectadas en el panel principal.
              </div>
            ) : null}
          </section>

          <section id="promociones-meta" className="surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">Promociones Meta</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                  Crea promociones para tus enlaces de afiliado. Puedes usar la cuenta Meta principal de AFFILIX o guardar tu propia cuenta Meta.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-right">
                <div className="text-[10px] uppercase tracking-[.14em] text-[var(--text-muted)]">Meta propia</div>
                <div className="font-mono text-sm text-white">{ownMetaAccount?.connected ? "Conectada" : "Sin conectar"}</div>
              </div>
            </div>

            {params.meta === "error" && params.message ? (
              <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{params.message}</div>
            ) : null}

            <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_.9fr]">
              <form action="/api/affiliate/meta-promotions" method="post" className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <h3 className="font-display text-lg font-bold">Crear promocion</h3>
                <select className="input" name="source_product_id" required>
                  <option value="">Selecciona producto para promocionar</option>
                  {mainProducts.slice(0, 80).map((product) => (
                    <option key={product.id} value={product.id}>{publicProductText(product.title)}</option>
                  ))}
                </select>
                <select className="input" name="meta_account_mode" required>
                  <option value="affilix_main">Usar cuenta Meta principal AFFILIX</option>
                  <option value="affiliate_own">Usar mi propia cuenta Meta</option>
                </select>
                <div className="grid gap-2 sm:grid-cols-4">
                  {[20, 50, 100].map((amount) => (
                    <label key={amount} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-3 text-sm font-bold">
                      <input type="radio" name="budget_preset" value={amount} defaultChecked={amount === 20} />
                      {amount} EUR
                    </label>
                  ))}
                  <input className="input" name="budget_custom" type="number" min="1" step="1" placeholder="Otro" />
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-input)] p-4">
                  <div className="text-sm font-bold">Mi propia cuenta Meta</div>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Solo rellena estos campos si eliges usar tu propia cuenta Meta. Si usas AFFILIX, se usa la cuenta oficial conectada en el panel principal.</p>
                  <div className="mt-3 grid gap-2">
                    <input className="input" name="own_access_token" placeholder="Codigo de conexion Meta" />
                    <input className="input" name="own_ad_account_id" defaultValue={ownMetaAccount?.ad_account_id || ""} placeholder="Cuenta publicitaria Meta" />
                    <input className="input" name="own_page_id" defaultValue={ownMetaAccount?.page_id || ""} placeholder="Pagina Meta" />
                    <input className="input" name="own_pixel_id" placeholder="Pixel Meta opcional" />
                  </div>
                </div>
                <button className="btn btn-primary w-full" type="submit">Crear promocion Meta</button>
              </form>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <h3 className="font-display text-lg font-bold">Como funciona</h3>
                <div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)]">
                  <div className="rounded-lg bg-[var(--bg-input)] p-3"><strong className="text-white">Cuenta AFFILIX:</strong> la campana se crea en la cuenta Meta oficial del panel principal y apunta a tu enlace afiliado.</div>
                  <div className="rounded-lg bg-[var(--bg-input)] p-3"><strong className="text-white">Cuenta propia:</strong> guardas tus datos Meta y la campana se crea en tu cuenta publicitaria.</div>
                  <div className="rounded-lg bg-[var(--bg-input)] p-3"><strong className="text-white">Presupuesto:</strong> el importe queda configurado como presupuesto mensual de esa campana. Meta cobra segun el metodo de pago de la cuenta usada.</div>
                  <div className="rounded-lg bg-[var(--bg-input)] p-3"><strong className="text-white">Seguridad:</strong> las campanas nacen pausadas para revisar antes de activarlas.</div>
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[var(--bg-elevated)] text-xs uppercase text-[var(--text-muted)]">
                  <tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Producto</th><th className="px-5 py-3">Cuenta</th><th className="px-5 py-3">Presupuesto</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Campaign</th></tr>
                </thead>
                <tbody>
                  {metaPromotions.map((item) => (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className="px-5 py-4">{item.created_at ? new Date(item.created_at).toLocaleDateString("es-ES") : "-"}</td>
                      <td className="px-5 py-4">{mainProductById.get(item.source_product_id)?.title || item.source_product_id}</td>
                      <td className="px-5 py-4">{item.meta_account_mode === "affilix_main" ? "AFFILIX" : "Propia"}</td>
                      <td className="px-5 py-4">{money(Number(item.budget_amount || 0), item.currency || "EUR")}</td>
                      <td className="px-5 py-4">{item.status}{item.error_message ? `: ${item.error_message}` : ""}</td>
                      <td className="px-5 py-4 font-mono">{item.campaign_id || "-"}</td>
                    </tr>
                  ))}
                  {!metaPromotions.length ? <tr><td className="px-5 py-8 text-center text-[var(--text-secondary)]" colSpan={6}>Todavia no hay promociones Meta creadas por este afiliado.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>

          <section id="productos-publicados" className="surface overflow-hidden">
            <div className="border-b border-[var(--border)] p-5">
              <h2 className="font-display text-xl font-bold">Panel de productos publicados</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Productos que ya estan dentro de tu web afiliada.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[var(--bg-elevated)] text-xs uppercase text-[var(--text-muted)]">
                  <tr><th className="px-5 py-3">Producto</th><th className="px-5 py-3">Precio</th><th className="px-5 py-3">Clicks</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Publico</th></tr>
                </thead>
                <tbody>
                  {ownProducts.map((product) => (
                    <tr key={product.id} className="border-t border-[var(--border)]">
                      <td className="px-5 py-4">{product.title}</td>
                      <td className="px-5 py-4">{money(product.price, product.currency)}</td>
                      <td className="px-5 py-4">{product.total_clicks}</td>
                      <td className="px-5 py-4">{product.is_active ? "Activo" : "Pausado"}</td>
                      <td className="px-5 py-4"><Link className="text-[var(--accent-gold)]" href={`/a/${partner.store_slug}/${product.slug}`}>Abrir</Link></td>
                    </tr>
                  ))}
                  {!ownProducts.length ? <tr><td className="px-5 py-8 text-center text-[var(--text-secondary)]" colSpan={5}>Todavia no has publicado productos en tu web.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>

          <section id="pagina-web" className="surface p-5">
            <h2 className="font-display text-xl font-bold">Panel de pagina web</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Usa estos accesos segun donde publicaste el producto: web principal AFFILIX para productos publicados en la tienda principal, y mi web afiliada para productos publicados en tu tienda propia.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-[var(--bg-elevated)] p-4">
                <div className="text-xs text-[var(--text-muted)]">Web principal AFFILIX</div>
                <div className="mt-2 break-all font-mono text-sm text-white">{mainStoreUrl}</div>
                <Link className="btn btn-primary mt-3 w-full" href={mainStoreUrl}>Abrir web principal</Link>
              </div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-4">
                <div className="text-xs text-[var(--text-muted)]">Mi web afiliada</div>
                <div className="mt-2 break-all font-mono text-sm text-white">{ownSiteUrl.startsWith("/") ? `${getStoreBaseUrl()}${ownSiteUrl}` : ownSiteUrl}</div>
                <Link className="btn mt-3 w-full" href={ownSiteUrl}>Abrir mi web afiliada</Link>
                <div className="mt-3 text-xs text-[var(--text-secondary)]">Se usa la web que el afiliado puso en ajustes. Si no tiene una, se usa su tienda interna.</div>
              </div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-4">
                <div className="text-xs text-[var(--text-muted)]">Dominio conectado</div>
                <div className="mt-2 break-all font-mono text-sm text-white">{partner.custom_domain || "Sin dominio conectado"}</div>
                <div className="mt-3 text-xs text-[var(--text-secondary)]">{partner.domain_status || "not_configured"}</div>
                <a className="btn mt-3 w-full" href="#ajustes">Editar ajustes web</a>
              </div>
            </div>
          </section>

          <section id="analitica" className="surface p-5">
            <h2 className="font-display text-xl font-bold">Panel de analitica</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-[var(--bg-elevated)] p-5">
                <div className="text-xs text-[var(--text-muted)]">Meta de clicks</div>
                <div className="mt-2 flex items-end justify-between gap-3"><div className="font-mono text-2xl">{totalClicks}</div><div className="text-xs text-[var(--text-secondary)]">/ {clickGoal || "sin meta"}</div></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-input)]"><div className="h-full bg-[var(--accent-gold)]" style={{ width: `${progressValue(totalClicks, clickGoal)}%` }} /></div>
              </div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-5">
                <div className="text-xs text-[var(--text-muted)]">Meta de ventas</div>
                <div className="mt-2 flex items-end justify-between gap-3"><div className="font-mono text-2xl">{sales}</div><div className="text-xs text-[var(--text-secondary)]">/ {salesGoal || "sin meta"}</div></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-input)]"><div className="h-full bg-[var(--accent-green)]" style={{ width: `${progressValue(sales, salesGoal)}%` }} /></div>
              </div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-5">
                <div className="text-xs text-[var(--text-muted)]">Meta venta bruta</div>
                <div className="mt-2 flex items-end justify-between gap-3"><div className="font-mono text-2xl">{money(grossSales)}</div><div className="text-xs text-[var(--text-secondary)]">/ {revenueGoal ? money(revenueGoal) : "sin meta"}</div></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-input)]"><div className="h-full bg-[var(--accent-purple)]" style={{ width: `${progressValue(grossSales, revenueGoal)}%` }} /></div>
              </div>
            </div>
          </section>

          <section id="ajustes" className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
            <div className="surface p-5">
              <h2 className="font-display text-xl font-bold">Panel de ajustes</h2>
              <form action="/api/affiliate/settings" method="post" className="mt-5 space-y-3">
                <input className="input" name="full_name" defaultValue={partner.full_name} placeholder="Nombre completo" required />
                <input className="input" name="email" type="email" defaultValue={partner.email} placeholder="Correo de acceso" required />
                <input className="input" name="brand_name" defaultValue={partner.brand_name} placeholder="Nombre de marca" required />
                <input className="input" name="store_slug" defaultValue={partner.store_slug} placeholder="slug-publico" required />
                <input className="input" name="website_url" defaultValue={partner.website_url || ""} placeholder="https://miweb.com" />
                <input className="input" name="custom_domain" defaultValue={partner.custom_domain || ""} placeholder="midominio.com" />
                <input className="input" name="payout_email" defaultValue={partner.payout_email || ""} placeholder="Correo de pago" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <input className="input" name="promotion_goal_clicks" type="number" min="0" step="1" defaultValue={Number(partner.promotion_goal_clicks || 0)} placeholder="Meta clicks" />
                  <input className="input" name="promotion_goal_sales" type="number" min="0" step="1" defaultValue={Number(partner.promotion_goal_sales || 0)} placeholder="Meta ventas" />
                  <input className="input" name="promotion_goal_revenue" type="number" min="0" step="0.01" defaultValue={Number(partner.promotion_goal_revenue || 0)} placeholder="Meta venta bruta" />
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-secondary)]">
                  Reparto actual: {Number(partner.affiliate_commission_rate)}% afiliado / {Number(partner.owner_commission_rate)}% AFFILIX.
                </div>
                <button className="btn btn-primary w-full" type="submit">Guardar ajustes</button>
              </form>
            </div>

            <div className="surface border-red-500/30 p-5">
              <h2 className="font-display text-xl font-bold text-red-100">Cerrar cuenta</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Si ya no quieres seguir como afiliado, confirma el cierre y dinos el motivo.</p>
              <form action="/api/affiliate/account/close" method="post" className="mt-5 space-y-3">
                <select className="input" name="close_reason" required>
                  <option value="">Selecciona un motivo</option>
                  <option value="no_entiendo_panel">No entiendo bien el panel</option>
                  <option value="no_me_gustan_productos">No me gustan los productos disponibles</option>
                  <option value="no_tengo_resultados">No estoy consiguiendo resultados</option>
                  <option value="problema_pago">Tengo dudas o problemas con pagos</option>
                  <option value="tengo_otra_plataforma">Uso otra plataforma</option>
                  <option value="otro">Otro motivo</option>
                </select>
                <textarea className="input min-h-32 py-3" name="close_feedback" placeholder="Describe que paso o que no te gusto."></textarea>
                <label className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                  <input className="mt-1" type="checkbox" name="confirm_close" value="yes" required />
                  <span>Confirmo que quiero cerrar mi cuenta afiliada y pausar mi acceso.</span>
                </label>
                <button className="btn w-full" type="submit">Cerrar cuenta afiliada</button>
              </form>
            </div>
          </section>

          <section id="mis-comisiones" className="surface overflow-hidden">
            <div className="border-b border-[var(--border)] p-5">
              <h2 className="font-display text-xl font-bold">Historial de comisiones</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[var(--bg-elevated)] text-xs uppercase text-[var(--text-muted)]">
                  <tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Producto</th><th className="px-5 py-3">Venta</th><th className="px-5 py-3">Mi comision</th><th className="px-5 py-3">Estado</th></tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="border-t border-[var(--border)]">
                      <td className="px-5 py-4">{commission.earned_at ? new Date(commission.earned_at).toLocaleDateString("es-ES") : "-"}</td>
                      <td className="px-5 py-4">{commission.product_id ? ownProductById.get(commission.product_id)?.title || mainProductById.get(commission.product_id)?.title || commission.product_id : "-"}</td>
                      <td className="px-5 py-4">{money(commission.gross_sale_amount)}</td>
                      <td className="px-5 py-4">{money(commission.affiliate_commission_amount)}</td>
                      <td className="px-5 py-4">{commission.status}</td>
                    </tr>
                  ))}
                  {!commissions.length ? <tr><td className="px-5 py-8 text-center text-[var(--text-secondary)]" colSpan={5}>Todavia no tienes comisiones registradas.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
