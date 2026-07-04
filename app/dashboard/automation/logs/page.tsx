import { getAdminDb } from "@/lib/supabase";

type AgentLogRow = {
  id: string;
  created_at: string;
  action: string;
  status: "success" | "error" | "running" | string;
  details?: Record<string, unknown> | null;
  duration_ms?: number | null;
};

function actionTitle(action: string) {
  const value = action.toLowerCase();
  if (value.includes("discover")) return "Descubrimiento de productos";
  if (value.includes("marketing")) return "Marketing automatico";
  if (value.includes("content")) return "Contenido IA";
  if (value.includes("price")) return "Revision de precios";
  if (value.includes("new-release")) return "Nuevos lanzamientos";
  if (value.includes("daily-report")) return "Informe diario";
  if (value.includes("product_imported")) return "Producto importado";
  if (value.includes("save_state")) return "Estado actualizado";
  if (value.includes("run_now")) return "Ejecucion manual";
  return action.replace(/[_-]/g, " ");
}

function actionDescription(action: string) {
  const value = action.toLowerCase();
  if (value.includes("discover")) return "AFFILIX busco productos o nichos para publicar en la tienda.";
  if (value.includes("marketing")) return "El sistema preparo contenido, campanas o metricas de marketing.";
  if (value.includes("content")) return "Se genero texto comercial, SEO o contenido con IA.";
  if (value.includes("price")) return "Se revisaron precios, disponibilidad o cambios de catalogo.";
  if (value.includes("daily-report")) return "Se preparo el resumen diario del negocio.";
  if (value.includes("product_imported")) return "Un producto entro al catalogo interno.";
  return "Evento operativo registrado por el sistema.";
}

function statusStyle(status: string) {
  if (status === "success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (status === "error") return "border-red-500/30 bg-red-500/10 text-red-200";
  return "border-amber-500/30 bg-amber-500/10 text-amber-100";
}

function statusLabel(status: string) {
  if (status === "success") return "Correcto";
  if (status === "error") return "Error";
  if (status === "running") return "En curso";
  return status || "Sin estado";
}

function detailSummary(details?: Record<string, unknown> | null) {
  if (!details) return "Sin detalles adicionales.";
  const parts = [
    typeof details.found === "number" ? `${details.found} encontrados` : null,
    typeof details.saved === "number" ? `${details.saved} guardados` : null,
    Array.isArray(details.errors) ? `${details.errors.length} errores` : null,
    typeof details.generated === "number" ? `${details.generated} contenidos generados` : null,
    typeof details.published === "number" ? `${details.published} publicaciones` : null,
    typeof details.campaigns === "number" ? `${details.campaigns} campanas` : null,
  ].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  const keys = Object.keys(details).slice(0, 4);
  return keys.length ? `Datos registrados: ${keys.join(", ")}.` : "Sin detalles adicionales.";
}

function smallDetails(details?: Record<string, unknown> | null) {
  if (!details) return [];
  return Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined && typeof value !== "object")
    .slice(0, 6)
    .map(([key, value]) => ({ key: key.replace(/[_-]/g, " "), value: String(value) }));
}

export default async function AutomationLogsPage() {
  let logs: AgentLogRow[] = [];
  let errorMessage = "";

  try {
    logs = await getAdminDb().select<AgentLogRow>("agent_logs", { select: "*", order: "created_at.desc", limit: "120" });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "No se pudieron cargar logs.";
  }

  const success = logs.filter((log) => log.status === "success").length;
  const errors = logs.filter((log) => log.status === "error").length;
  const running = logs.filter((log) => log.status === "running").length;
  const lastLog = logs[0]?.created_at ? new Date(logs[0].created_at).toLocaleString("es-ES") : "Sin actividad";

  return (
    <div className="space-y-6">
      <header className="surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase text-[var(--accent-gold)]">Centro de actividad</div>
            <h1 className="font-display mt-2 text-3xl font-bold">Logs de automatizacion</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">
              Aqui ves que hizo AFFILIX, cuando lo hizo y si termino bien. Sirve para revisar busquedas automaticas, contenido IA, marketing, errores y tareas programadas sin leer codigo tecnico.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-right">
            <div className="text-xs text-[var(--text-muted)]">Ultimo evento</div>
            <div className="mt-1 font-mono text-sm text-white">{lastLog}</div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Eventos</div><div className="mt-2 font-mono text-3xl">{logs.length}</div></div>
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Correctos</div><div className="mt-2 font-mono text-3xl text-emerald-300">{success}</div></div>
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Errores</div><div className="mt-2 font-mono text-3xl text-red-300">{errors}</div></div>
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">En curso</div><div className="mt-2 font-mono text-3xl text-amber-200">{running}</div></div>
      </section>

      <section className="surface p-5">
        <h2 className="font-display text-xl font-bold">Como leer este panel</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-[var(--bg-elevated)] p-4 text-sm"><strong>Correcto</strong><p className="mt-1 text-[var(--text-secondary)]">La tarea termino y guardo su resultado.</p></div>
          <div className="rounded-xl bg-[var(--bg-elevated)] p-4 text-sm"><strong>Error</strong><p className="mt-1 text-[var(--text-secondary)]">La tarea fallo por API, datos o conexion. Revisa el mensaje.</p></div>
          <div className="rounded-xl bg-[var(--bg-elevated)] p-4 text-sm"><strong>En curso</strong><p className="mt-1 text-[var(--text-secondary)]">La automatizacion fue lanzada y todavia no termino.</p></div>
        </div>
      </section>

      {errorMessage ? (
        <div className="surface border-[rgba(245,166,35,.35)] p-4 text-sm text-[var(--accent-gold)]">
          No se pudo leer el historial: {errorMessage}
        </div>
      ) : null}

      <section className="surface overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <h2 className="font-display text-xl font-bold">Historial reciente</h2>
        </div>
        {logs.length ? (
          <div className="divide-y divide-[var(--border)]">
            {logs.map((log, index) => (
              <article key={log.id} className="grid gap-4 p-5 md:grid-cols-[72px_1fr_150px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-elevated)] font-mono text-sm text-[var(--accent-gold)]">#{index + 1}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold">{actionTitle(log.action)}</h3>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(log.status)}`}>{statusLabel(log.status)}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{actionDescription(log.action)}</p>
                  <div className="mt-3 rounded-xl bg-[var(--bg-elevated)] p-3 text-sm text-[var(--text-secondary)]">{detailSummary(log.details)}</div>
                  {smallDetails(log.details).length ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {smallDetails(log.details).map((item) => (
                        <div key={item.key} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs">
                          <div className="text-[var(--text-muted)]">{item.key}</div>
                          <div className="mt-1 font-mono text-white">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  <div className="font-mono text-xs">{new Date(log.created_at).toLocaleString("es-ES")}</div>
                  {log.duration_ms ? <div className="mt-2">Duracion: {log.duration_ms} ms</div> : null}
                  <div className="mt-2 break-all text-xs text-[var(--text-muted)]">{log.action}</div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
            Todavia no hay logs. Ejecuta una automatizacion, importa productos o activa marketing para ver actividad.
          </div>
        )}
      </section>
    </div>
  );
}
