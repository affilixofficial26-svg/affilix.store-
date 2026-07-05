import { BrainCircuit, CheckCircle2, Clock, FileText, Image, PackageSearch, Play, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getAdminDb } from "@/lib/supabase";

const agents = [
  { name: "MasterAgent", action: "run_full_cycle", icon: BrainCircuit, description: "Ejecuta ciclo completo: oportunidades, precios, contenido e imagenes." },
  { name: "CatalogAgent", action: "discover_products", icon: PackageSearch, description: "Busca oportunidades y guarda productos activos en catalogo." },
  { name: "MarketingAgent", action: "generate_content", icon: FileText, description: "Genera textos, SEO y piezas comerciales para productos activos." },
  { name: "MediaAgent", action: "generate_images", icon: Image, description: "Completa imagenes faltantes usando el motor IA configurado." },
  { name: "PricingAgent", action: "update_prices", icon: RefreshCw, description: "Revisa precios y selecciona ofertas destacadas." },
];

type AgentLog = {
  id: string;
  action: string;
  status: "success" | "error" | "running";
  duration_ms: number | null;
  created_at: string;
};

async function getRecentLogs() {
  try {
    return await getAdminDb().select<AgentLog>("agent_logs", {
      select: "id,action,status,duration_ms,created_at",
      order: "created_at.desc",
      limit: "8",
    });
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function AgentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [logs, params] = await Promise.all([getRecentLogs(), searchParams]);
  const agentStatus = typeof params?.agent === "string" ? params.agent : null;
  const agentAction = typeof params?.action === "string" ? params.action : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--accent-blue)]">AFFILIX Digital Hub</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Agentes IA activos</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
            Control central de agentes reales conectados al endpoint `/api/ai/agent`, MuAPI, catalogo, marketing, imagenes y logs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn" href="/dashboard/automation/logs">Ver historial</Link>
          <Link className="btn btn-primary" href="/dashboard/media-studio">Abrir Media Studio</Link>
        </div>
      </header>

      {agentStatus === "ok" ? (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-5 text-sm font-bold text-emerald-100">
          Agente ejecutado correctamente: {agentAction || "accion completada"}.
        </div>
      ) : null}

      {agentStatus === "error" ? (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-5 text-sm font-bold text-red-100">
          El agente devolvio error. Revisa logs para ver el detalle.
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="surface p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[linear-gradient(135deg,#2563FF,#7C3AED,#00E5FF)] p-3 text-white">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">MasterAgent operativo</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                Ejecuta tareas reales y registra cada accion en `agent_logs`. Las acciones peligrosas siguen pasando por endpoints protegidos.
              </p>
            </div>
          </div>
          <form action="/api/ai/agent" method="post" className="mt-6 flex flex-wrap gap-2">
            <input type="hidden" name="return_to" value="/dashboard/agents" />
            <input type="hidden" name="action" value="run_full_cycle" />
            <input type="hidden" name="message" value="Ejecutar ciclo completo operativo AFFILIX" />
            <button className="btn btn-primary" type="submit">
              <Play className="h-4 w-4" />
              Ejecutar ciclo completo
            </button>
            <Link className="btn" href="/dashboard/logs">Ver logs del sistema</Link>
          </form>
        </div>

        <aside className="surface p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-400/15 p-3 text-emerald-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">Estado</h2>
              <p className="mt-1 text-xs font-bold text-emerald-300">Activo y protegido</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3 text-sm text-[var(--text-secondary)]">
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" /> Endpoint real conectado.</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" /> Logs guardados por ejecucion.</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" /> APIs admin protegidas por sesion firmada.</li>
          </ul>
        </aside>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {agents.map((agent) => (
          <div key={agent.name} className="surface p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white/[.06] p-2 text-[var(--accent-cyan)]">
                <agent.icon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display font-bold">{agent.name}</h2>
                <p className="mt-1 text-xs font-bold text-emerald-300">Activo</p>
              </div>
            </div>
            <p className="mt-3 min-h-[72px] text-xs leading-5 text-[var(--text-secondary)]">{agent.description}</p>
            <form action="/api/ai/agent" method="post" className="mt-4">
              <input type="hidden" name="return_to" value="/dashboard/agents" />
              <input type="hidden" name="action" value={agent.action} />
              <input type="hidden" name="message" value={`Ejecutar ${agent.name}`} />
              <button className="btn w-full" type="submit">
                <Play className="h-4 w-4" />
                Ejecutar
              </button>
            </form>
          </div>
        ))}
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-white/10 p-5">
          <h2 className="font-display text-xl font-bold">Ultimas ejecuciones</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Evidencia visible de acciones reales guardadas en la base de datos.</p>
        </div>
        <div className="divide-y divide-white/10">
          {logs.length ? logs.map((log) => (
            <div key={log.id} className="grid gap-3 p-4 text-sm md:grid-cols-[1fr_120px_120px_180px]">
              <div className="font-bold">{log.action}</div>
              <div className={log.status === "success" ? "text-emerald-300" : log.status === "running" ? "text-amber-300" : "text-red-300"}>{log.status}</div>
              <div className="text-[var(--text-secondary)]">{log.duration_ms ? `${log.duration_ms} ms` : "sin duracion"}</div>
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Clock className="h-4 w-4" />
                {new Date(log.created_at).toLocaleString("es-ES")}
              </div>
            </div>
          )) : (
            <div className="p-5 text-sm text-[var(--text-secondary)]">Ejecuta un agente para crear el primer log visible aqui.</div>
          )}
        </div>
      </section>
    </div>
  );
}
