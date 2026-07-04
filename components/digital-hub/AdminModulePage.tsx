import Link from "next/link";
import { BrainCircuit, Clock, ExternalLink, Settings, Sparkles, Workflow } from "lucide-react";
import { AdminCatalogList } from "@/components/digital-hub/AdminCatalogList";
import type { DigitalCatalogItem, DigitalItemType } from "@/lib/digital-hub";

type Action = {
  label: string;
  href: string;
  kind?: "primary" | "secondary";
};

type Agent = {
  name: string;
  status: "active" | "pending";
  description: string;
};

export function AdminModulePage({
  title,
  description,
  items = [],
  itemTypes,
  emptyTitle,
  emptyMessage,
  actions = [],
  agent,
  pending = [],
}: {
  title: string;
  description: string;
  items?: DigitalCatalogItem[];
  itemTypes?: DigitalItemType[];
  emptyTitle: string;
  emptyMessage: string;
  actions?: Action[];
  agent: Agent;
  pending?: string[];
}) {
  const scopedItems = itemTypes ? items.filter((item) => itemTypes.includes(item.item_type)) : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--accent-blue)]">AFFILIX Digital Hub</p>
          <h1 className="mt-2 font-display text-3xl font-bold">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link key={action.href + action.label} className={`btn ${action.kind === "primary" ? "btn-primary" : ""}`} href={action.href}>
              {action.kind === "primary" ? <Sparkles className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          {scopedItems.length ? (
            <AdminCatalogList items={items} types={itemTypes} />
          ) : (
            <div className="surface p-8">
              <h2 className="font-display text-2xl font-bold">{emptyTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{emptyMessage}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link className="btn btn-primary" href="/dashboard/catalog">Crear en catalogo</Link>
                <Link className="btn" href="/dashboard/settings">Revisar configuracion</Link>
              </div>
            </div>
          )}

          {pending.length ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-5">
              <div className="flex items-center gap-2 font-bold text-amber-100">
                <Clock className="h-4 w-4" />
                Pendiente de configuracion
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-100/85">
                {pending.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ) : null}
        </section>

        <aside className="surface p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[linear-gradient(135deg,#2563FF,#7C3AED,#00E5FF)] p-3 text-white">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">{agent.name}</h2>
              <p className={`mt-1 text-xs font-bold ${agent.status === "active" ? "text-emerald-300" : "text-amber-300"}`}>
                {agent.status === "active" ? "Activo" : "Pendiente"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{agent.description}</p>
          <div className="mt-5 grid gap-2">
            <Link className="btn" href="/dashboard/agents">
              <Workflow className="h-4 w-4" />
              Ejecutar agente
            </Link>
            <Link className="btn" href="/dashboard/logs">
              <ExternalLink className="h-4 w-4" />
              Ver logs
            </Link>
            <Link className="btn" href="/dashboard/settings">
              <Settings className="h-4 w-4" />
              Configurar permisos
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
