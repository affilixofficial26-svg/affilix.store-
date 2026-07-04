import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase";

type Result = {
  label: string;
  description: string;
  href: string;
  type: string;
};

type ProductRow = {
  id: string;
  title?: string | null;
  ai_title?: string | null;
  platform?: string | null;
  category?: string | null;
  slug?: string | null;
};

type PartnerRow = {
  id: string;
  full_name?: string | null;
  brand_name?: string | null;
  email?: string | null;
  store_slug?: string | null;
  status?: string | null;
};

type CommissionRow = {
  id?: string | null;
  platform?: string | null;
  order_id?: string | null;
  status?: string | null;
  commission_amount?: string | number | null;
};

type LogRow = {
  id?: string | null;
  action?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type NotificationRow = {
  id?: string | null;
  title?: string | null;
  message?: string | null;
  type?: string | null;
};

const panelPages: Result[] = [
  { label: "Panel principal", description: "Resumen general de productos, clics, comisiones y actividad.", href: "/dashboard", type: "pagina" },
  { label: "Notificaciones", description: "Avisos de ventas, registros, accesos, clicks y actividad de afiliados.", href: "/dashboard/notifications", type: "pagina" },
  { label: "Agente IA", description: "Ejecuta el agente, revisa tareas y registros de inteligencia artificial.", href: "/dashboard/ai-agent", type: "pagina" },
  { label: "Todos los productos", description: "Catalogo interno de productos guardados y publicados.", href: "/dashboard/products", type: "pagina" },
  { label: "Proveedores", description: "Conecta marketplaces, redes y proveedores para importar productos.", href: "/dashboard/providers", type: "pagina" },
  { label: "Descubrir nuevos", description: "Busca nichos y productos rentables para anadir a la tienda.", href: "/dashboard/products/discover", type: "pagina" },
  { label: "Oportunidades", description: "Ideas AFFILIX organizadas por impacto, coste y tiempo.", href: "/dashboard/opportunities", type: "pagina" },
  { label: "Contenido IA", description: "Genera descripciones, reviews y textos comerciales.", href: "/dashboard/content", type: "pagina" },
  { label: "Automatizacion", description: "Activa, pausa o ejecuta automatizaciones del sistema.", href: "/dashboard/automation", type: "pagina" },
  { label: "Logs", description: "Historial de acciones ejecutadas por el agente y el sistema.", href: "/dashboard/automation/logs", type: "pagina" },
  { label: "Marketing", description: "Control de contenido IA, publicaciones y promocion de productos.", href: "/dashboard/marketing", type: "pagina" },
  { label: "Meta Ads", description: "Presupuesto, campanas y promocion automatica de productos top.", href: "/dashboard/marketing/meta-ads", type: "pagina" },
  { label: "Analiticas", description: "Metricas de rendimiento, clics, conversiones y ventas.", href: "/dashboard/analytics", type: "pagina" },
  { label: "Comisiones", description: "Listado y exportacion de comisiones registradas.", href: "/dashboard/analytics/commissions", type: "pagina" },
  { label: "Afiliados", description: "Accesos separados, tiendas y reparto de comisiones.", href: "/dashboard/affiliates", type: "pagina" },
  { label: "Cuentas conectadas", description: "API keys y credenciales de afiliados o dropshipping.", href: "/dashboard/accounts", type: "pagina" },
  { label: "Configuracion", description: "Datos generales de la tienda, slug y moneda.", href: "/dashboard/settings", type: "pagina" },
  { label: "Config IA", description: "Proveedor, modelo y API key de inteligencia artificial.", href: "/dashboard/settings/ai-config", type: "pagina" },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function matches(result: Result, query: string) {
  const text = normalize(`${result.label} ${result.description} ${result.type}`);
  return normalize(query).split(/\s+/).filter(Boolean).every((token) => text.includes(token));
}

async function safeSelect<T>(table: string, query: Record<string, string>) {
  try {
    return await getAdminDb().select<T>(table, query);
  } catch {
    return [];
  }
}

function money(value: string | number | null | undefined) {
  const amount = Number(value || 0);
  return amount ? `${amount.toFixed(2)} EUR` : "sin importe";
}

export async function GET(req: NextRequest) {
  if (req.cookies.get("affilix_admin")?.value !== "true") {
    return NextResponse.json({ results: [] }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 2) return NextResponse.json({ results: [] });

  const [products, partners, commissions, logs, notifications] = await Promise.all([
    safeSelect<ProductRow>("affiliate_products", { select: "id,title,ai_title,platform,category,slug", order: "created_at.desc", limit: "80" }),
    safeSelect<PartnerRow>("affiliate_partners", { select: "id,full_name,brand_name,email,store_slug,status", order: "created_at.desc", limit: "60" }),
    safeSelect<CommissionRow>("commissions", { select: "id,platform,order_id,status,commission_amount", limit: "60" }),
    safeSelect<LogRow>("agent_logs", { select: "id,action,status,created_at", order: "created_at.desc", limit: "60" }),
    safeSelect<NotificationRow>("admin_notifications", { select: "id,title,message,type", order: "created_at.desc", limit: "60" }),
  ]);

  const dynamicResults: Result[] = [
    ...products.map((item) => ({
      label: item.ai_title || item.title || "Producto sin titulo",
      description: `Producto ${item.platform || "sin proveedor"}${item.category ? ` · ${item.category}` : ""}`,
      href: `/dashboard/products/${item.id}`,
      type: "producto",
    })),
    ...partners.map((item) => ({
      label: item.brand_name || item.full_name || item.email || "Afiliado sin nombre",
      description: `${item.email || "sin email"} · ${item.status || "sin estado"}${item.store_slug ? ` · /a/${item.store_slug}` : ""}`,
      href: "/dashboard/affiliates",
      type: "afiliado",
    })),
    ...commissions.map((item) => ({
      label: item.order_id ? `Comision ${item.order_id}` : `Comision ${item.platform || "registrada"}`,
      description: `${item.platform || "plataforma"} · ${item.status || "sin estado"} · ${money(item.commission_amount)}`,
      href: "/dashboard/analytics/commissions",
      type: "comision",
    })),
    ...logs.map((item) => ({
      label: item.action || "Log del sistema",
      description: `${item.status || "sin estado"}${item.created_at ? ` · ${new Date(item.created_at).toLocaleString("es-ES")}` : ""}`,
      href: "/dashboard/automation/logs",
      type: "log",
    })),
    ...notifications.map((item) => ({
      label: item.title || item.type || "Notificacion",
      description: item.message || item.type || "Aviso administrativo",
      href: "/dashboard/notifications",
      type: "aviso",
    })),
  ];

  const results = [...panelPages, ...dynamicResults].filter((item) => matches(item, query)).slice(0, 12);
  return NextResponse.json({ results });
}
