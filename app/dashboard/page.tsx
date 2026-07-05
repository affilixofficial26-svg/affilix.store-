import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { KPICard } from "@/components/dashboard/KPICard";
import { getAdminDb } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type CatalogRow = { id: string; item_type: string; status: string };
type OrderRow = { id: string; status: string; total: number | string; created_at: string };
type RunRow = { id: string; status: string; progress: number };
type LogRow = { action: string; status: string; created_at: string };
type AffiliateRow = { id: string; status: string };
type TicketRow = { id: string; status: string; created_at: string };
type FinanceRow = { type: string; amount_cents: number | string; currency: string; created_at: string };

async function getDashboardData() {
  try {
    const db = getAdminDb();
    const [items, orders, runs, logs, affiliates, tickets, finance] = await Promise.all([
      db.select<CatalogRow>("catalog_items", { select: "id,item_type,status", limit: "500" }),
      db.select<OrderRow>("customer_orders", { select: "id,status,total,created_at", order: "created_at.desc", limit: "250" }),
      db.select<RunRow>("service_runs", { select: "id,status,progress", limit: "250" }),
      db.select<LogRow>("agent_logs", { select: "action,status,created_at", order: "created_at.desc", limit: "10" }),
      db.select<AffiliateRow>("affiliates", { select: "id,status", limit: "100" }).catch(() => []),
      db.select<TicketRow>("support_tickets", { select: "id,status,created_at", limit: "100" }).catch(() => []),
      db.select<FinanceRow>("finance_events", { select: "type,amount_cents,currency,created_at", order: "created_at.desc", limit: "20" }).catch(() => []),
    ]);
    const now = Date.now();
    const day = 86400000;
    const paidOrders = orders.filter((order) => ["paid", "processing", "ready", "delivered"].includes(order.status));
    const revenueSince = (days: number) => paidOrders
      .filter((order) => new Date(order.created_at).getTime() >= now - days * day)
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    return {
      published: items.filter((item) => item.status === "published").length,
      revenueToday: revenueSince(1),
      revenue7d: revenueSince(7),
      revenue30d: revenueSince(30),
      orders7d: orders.filter((order) => new Date(order.created_at).getTime() >= now - 7 * day).length,
      services7d: runs.length,
      aiCostMonth: finance.filter((event) => event.type === "fee").reduce((sum, event) => sum + Number(event.amount_cents || 0) / 100, 0),
      pendingOrders: orders.filter((order) => ["paid", "processing"].includes(order.status)).length,
      pendingRuns: runs.filter((run) => ["queued", "running", "review"].includes(run.status)).length,
      pendingAffiliates: affiliates.filter((item) => ["pending", "review"].includes(item.status)).length,
      pendingPayouts: 0,
      oldTickets: tickets.filter((ticket) => !["closed", "resolved"].includes(ticket.status) && new Date(ticket.created_at).getTime() < now - day).length,
      logs: [
        ...finance.slice(0, 5).map((event) => ({ title: event.type, detail: `${event.currency} ${Number(event.amount_cents) / 100}`, created_at: event.created_at, type: "finance" })),
        ...logs.map((log) => ({ title: log.action, detail: log.status, created_at: log.created_at, type: "agent" })),
      ].slice(0, 10),
    };
  } catch {
    return {
      published: 0, revenueToday: 0, revenue7d: 0, revenue30d: 0, orders7d: 0, services7d: 0, aiCostMonth: 0,
      pendingOrders: 0, pendingRuns: 0, pendingAffiliates: 0, pendingPayouts: 0, oldTickets: 0, logs: [],
    };
  }
}

function ActionRow({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-3">
        <strong className={value ? "text-amber-200" : "text-emerald-200"}>{value}</strong>
        <Link className="btn btn-sm" href={href}>Ir <ExternalLink className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  );
}

function Integration({ name, ok }: { name: string; ok: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold">
      {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />}
      {name}
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardData();
  const actionTotal = stats.pendingOrders + stats.pendingRuns + stats.pendingAffiliates + stats.pendingPayouts + stats.oldTickets;
  const budget = Number(process.env.MUAPI_MONTHLY_BUDGET_USD || 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Panel operativo</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Lo que requiere accion ahora: pedidos, servicios, soporte, integraciones y costes.</p>
      </div>

      <section className="surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Bandeja de accion</h2>
          {actionTotal === 0 ? <span className="text-sm text-emerald-200">Al dia. Nada requiere tu atencion ahora.</span> : null}
        </div>
        <div className="grid gap-2 lg:grid-cols-5">
          <ActionRow label="Pedidos por revisar" value={stats.pendingOrders} href="/dashboard/orders" />
          <ActionRow label="Servicios IA por aprobar" value={stats.pendingRuns} href="/dashboard/ai-services" />
          <ActionRow label="Afiliados pendientes" value={stats.pendingAffiliates} href="/dashboard/affiliates" />
          <ActionRow label="Payouts pendientes" value={stats.pendingPayouts} href="/dashboard/finance" />
          <ActionRow label="Tickets > 24h" value={stats.oldTickets} href="/dashboard/logs" />
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KPICard label="Ingresos hoy" value={stats.revenueToday} kind="money" />
        <KPICard label="Ingresos 7d" value={stats.revenue7d} kind="money" accent="var(--accent-green)" />
        <KPICard label="Ingresos 30d" value={stats.revenue30d} kind="money" accent="var(--accent-blue)" />
        <KPICard label="Pedidos 7d" value={stats.orders7d} accent="var(--accent-amber)" />
        <KPICard label="Servicios IA 7d" value={stats.services7d} accent="var(--accent-gold)" />
        <KPICard label={`Coste IA / $${budget}`} value={stats.aiCostMonth} kind="money" accent="var(--accent-blue)" />
      </div>

      <div className="surface p-4">
        <h2 className="mb-3 font-display text-xl font-bold">Semaforo de integraciones</h2>
        <div className="flex flex-wrap gap-2">
          <Integration name="Stripe" ok={Boolean(process.env.STRIPE_SECRET_KEY)} />
          <Integration name="MuAPI" ok={Boolean(process.env.MUAPI_API_KEY)} />
          <Integration name="Resend" ok={Boolean(process.env.RESEND_API_KEY)} />
          <Integration name="Meta" ok={Boolean(process.env.META_ACCESS_TOKEN)} />
          <Integration name="Supabase" ok={Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)} />
          <Integration name="Storage" ok={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)} />
          <Integration name="Crons" ok={Boolean(process.env.CRON_SECRET)} />
        </div>
      </div>

      <ActivityFeed rows={stats.logs} />
    </div>
  );
}
