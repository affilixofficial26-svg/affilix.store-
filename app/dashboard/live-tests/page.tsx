import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Play,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { getLiveTestDashboard } from "@/lib/live-tests";

export const dynamic = "force-dynamic";

const suites = [
  ["all", "Ejecutar todas las pruebas", Play],
  ["public", "Ejecutar solo publicas", Activity],
  ["admin", "Ejecutar solo admin", Activity],
  ["affiliate", "Ejecutar solo afiliado", Activity],
  ["payments", "Ejecutar solo pagos/entregas", Activity],
  ["muapi", "Ejecutar solo MuAPI", Activity],
] as const;

function kpi(label: string, value: string | number, tone = "text-white") {
  return (
    <div className="surface p-4">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">{label}</div>
      <div className={`mt-2 font-display text-2xl font-black ${tone}`}>{value}</div>
    </div>
  );
}

function statusBadge(status: string) {
  const tone =
    status === "passed" || status === "fixed"
      ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
      : status === "failed" || status === "blocked"
        ? "border-red-300/30 bg-red-400/10 text-red-100"
        : status === "skipped"
          ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
          : "border-white/15 bg-white/10 text-white";
  const Icon = status === "passed" || status === "fixed" ? CheckCircle2 : status === "failed" || status === "blocked" ? XCircle : Clock3;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

export default async function LiveTestsPage() {
  const { latest, runs, steps, totals } = await getLiveTestDashboard();
  const latestSteps = latest ? steps.filter((step) => step.run_id === latest.id) : steps.slice(0, 50);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-gold)]">QA real visible</div>
          <h1 className="mt-2 font-display text-3xl font-bold">Centro de pruebas en vivo</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">
            Pruebas reales ejecutadas con navegador sobre la web publica, panel admin, panel afiliado, pagos, entregas, MuAPI, emails y automatizaciones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn" href="/docs/FINAL_QA_REPORT.md" target="_blank"><FileText className="h-4 w-4" /> Ver ultimo reporte</Link>
          <Link className="btn" href="/docs/FINAL_QA_REPORT.md" download><Download className="h-4 w-4" /> Descargar reporte</Link>
          <form action="/api/live-tests/clear" method="post">
            <button className="btn" type="submit"><Trash2 className="h-4 w-4" /> Limpiar solo pruebas antiguas</button>
          </form>
        </div>
      </div>

      <div className="surface p-4">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          {suites.map(([suite, label, Icon]) => (
            <form key={suite} action="/api/live-tests/run" method="post">
              <input type="hidden" name="suite" value={suite} />
              <button className="btn btn-primary w-full justify-center" type="submit">
                <Icon className="h-4 w-4" />
                {label}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpi("Total pruebas", totals.total)}
        {kpi("Pasadas", totals.passed, "text-emerald-100")}
        {kpi("Fallidas", totals.failed, "text-red-100")}
        {kpi("Arregladas", totals.fixed, "text-cyan-100")}
        {kpi("En cola", totals.pending, "text-cyan-100")}
        {kpi("Coste MuAPI en pruebas", `$${totals.muapiCost.toFixed(4)}`)}
        {kpi("Emails enviados en pruebas", totals.emails)}
        {kpi("Pedidos test creados", totals.orders)}
        {kpi("Entregas test creadas", totals.deliveries)}
        {kpi("Runs registrados", runs.length)}
      </div>

      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-[var(--border)] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Ultima ejecucion visible</h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{latest ? `${latest.title} · ${new Date(latest.created_at).toLocaleString("es-ES")}` : "Todavia no hay pruebas registradas."}</p>
          </div>
          {latest ? statusBadge(latest.status) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Prueba</th>
                <th className="px-4 py-3">Panel</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Ruta</th>
                <th className="px-4 py-3">Ultima ejecucion</th>
                <th className="px-4 py-3">Evidencia</th>
                <th className="px-4 py-3">Accion</th>
              </tr>
            </thead>
            <tbody>
              {latestSteps.length ? latestSteps.map((step) => (
                <tr key={step.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3">{statusBadge(step.status)}</td>
                  <td className="px-4 py-3 font-bold">{step.test_name}</td>
                  <td className="px-4 py-3">{step.panel}</td>
                  <td className="px-4 py-3">{step.actor}</td>
                  <td className="px-4 py-3 font-mono text-xs">{step.route || "-"}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{new Date(step.finished_at || step.started_at).toLocaleString("es-ES")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {step.screenshot_path ? <Link className="btn btn-sm" href={step.screenshot_path} target="_blank">Ver screenshot</Link> : null}
                      {step.trace_path ? <Link className="btn btn-sm" href={step.trace_path} target="_blank">Ver trace</Link> : null}
                      {step.logs_path ? <Link className="btn btn-sm" href={step.logs_path} target="_blank">Ver logs</Link> : null}
                      {!step.screenshot_path && !step.trace_path && !step.logs_path ? <span className="text-xs text-[var(--text-secondary)]">Registro DB</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link className="btn btn-sm" href={`/dashboard/live-tests?run=${step.run_id}`}>Ver detalle</Link>
                      <form action="/api/live-tests/run" method="post">
                        <input type="hidden" name="suite" value={latest?.suite || "all"} />
                        <button className="btn btn-sm" type="submit"><RefreshCw className="h-3.5 w-3.5" /> Repetir prueba</button>
                      </form>
                      {step.route ? <Link className="btn btn-sm" href={step.route} target="_blank"><ExternalLink className="h-3.5 w-3.5" /> Abrir ruta</Link> : null}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-8 text-center text-[var(--text-secondary)]" colSpan={8}>
                    Ejecuta una suite para ver evidencias, rutas, actores y resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
