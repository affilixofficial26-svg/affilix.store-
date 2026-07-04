import Link from "next/link";
import { ArrowRight, BadgeEuro, Bot, Boxes, Sparkles } from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { getAdminDb } from "@/lib/supabase";

type CatalogRow = { id: string; item_type: string; title: string; status: string; total_sales: number | null };
type OrderRow = { id: string; status: string; total: number | string; created_at: string };
type RunRow = { id: string; status: string; progress: number };
type LogRow = { action: string; status: string; created_at: string };

async function getDigitalStats() {
  try {
    const db = getAdminDb();
    const [items, orders, runs, logs] = await Promise.all([
      db.select<CatalogRow>("catalog_items", { select: "id,item_type,title,status,total_sales" }),
      db.select<OrderRow>("customer_orders", { select: "id,status,total,created_at" }),
      db.select<RunRow>("service_runs", { select: "id,status,progress" }),
      db.select<LogRow>("agent_logs", { select: "action,status,created_at", order: "created_at.desc", limit: "10" }),
    ]);
    const paidOrders = orders.filter((order) => ["paid", "processing", "ready", "delivered"].includes(order.status));
    const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const chart = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(Date.now() - (6 - index) * 86400000).toISOString().slice(0, 10);
      return {
        date,
        value: paidOrders.filter((order) => order.created_at.startsWith(date)).reduce((sum, order) => sum + Number(order.total || 0), 0),
      };
    });
    return {
      published: items.filter((item) => item.status === "published").length,
      revenue,
      pendingOrders: orders.filter((order) => ["pending", "paid", "processing"].includes(order.status)).length,
      activeRuns: runs.filter((run) => ["queued", "running", "review"].includes(run.status)).length,
      chart,
      logs: logs.map((log) => ({ title: log.action, detail: log.status, created_at: log.created_at, type: "agent" })),
      ready: true,
    };
  } catch {
    return { published: 0, revenue: 0, pendingOrders: 0, activeRuns: 0, chart: [], logs: [], ready: true };
  }
}

const engines = [
  ["Catalogo digital", "/dashboard/catalog", "Productos, bundles y recursos", Boxes],
  ["Servicios IA", "/dashboard/ai-services", "Ordenes y produccion asistida", Bot],
  ["Kits de negocio", "/dashboard/business-kits", "Paquetes por sector", Sparkles],
  ["SaaS y afiliacion", "/dashboard/saas", "Herramientas y comparativas", BadgeEuro],
] as const;

export default async function DashboardPage() {
  const stats = await getDigitalStats();

  return (
    <div className="space-y-6">
      <div className="surface p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[var(--accent-gold)]">AFFILIX Digital Hub</p>
            <h1 className="mt-3 font-display text-4xl font-black leading-tight text-white">Centro de control</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
              Catalogo propio, servicios IA, pedidos, SaaS y automatizacion desde una sola operacion.
            </p>
          </div>
          <Link className="btn btn-primary min-h-12 px-5" href="/dashboard/catalog">
            Abrir catalogo <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      {!stats.ready ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
          <h2 className="font-bold text-amber-100">Falta activar el modelo Digital Hub</h2>
          <p className="mt-2 text-sm leading-6 text-amber-100/80">
            Aplica la migracion 015 en Supabase. El sistema conserva el modelo anterior mientras se completa la transicion.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Ingresos digitales" value={stats.revenue} kind="money" />
        <KPICard label="Catalogo publicado" value={stats.published} accent="var(--accent-blue)" />
        <KPICard label="Pedidos en curso" value={stats.pendingOrders} accent="var(--accent-amber)" />
        <KPICard label="Trabajos IA activos" value={stats.activeRuns} accent="var(--accent-green)" />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {engines.map(([name, href, copy, Icon]) => (
          <Link key={href} href={href} className="surface group p-5 transition hover:-translate-y-0.5 hover:border-amber-200/25">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200/15 bg-amber-300/10 text-[var(--accent-gold)]">
              <Icon size={21} />
            </span>
            <h2 className="font-display text-lg font-bold">{name}</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{copy}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[var(--accent-gold)]">
              Abrir modulo <ArrowRight className="transition group-hover:translate-x-1" size={14} />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <RevenueChart
          title="Ingresos digitales por dia"
          data={stats.chart.length ? stats.chart : Array.from({ length: 7 }, (_, index) => ({ date: `D${index + 1}`, value: 0 }))}
        />
        <ActivityFeed rows={stats.logs} />
      </div>
    </div>
  );
}
