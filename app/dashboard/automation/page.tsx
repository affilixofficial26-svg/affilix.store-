import { getLocalAutomationSettings, parseTimesFromCron } from "@/lib/local-automation-settings";
import { getAdminDb } from "@/lib/supabase";

type AutomationState = {
  automation_id: string;
  enabled: boolean;
  schedule_cron: string;
  days_interval?: number;
  times?: string[];
};

const automations = [
  ["auto_discover", "Descubrimiento de productos", "Busca productos nuevos en todas tus plataformas conectadas.", "09:00", "", "Agrega productos candidatos al catalogo."],
  ["auto_content", "Generacion de contenido IA", "Genera copy, review, pros, contras y SEO para productos pendientes.", "02:00", "", "Productos con contenido optimizado."],
  ["auto_prices", "Actualizacion de precios", "Verifica precios y disponibilidad de productos publicados.", "09:00", "19:00", "Precios actualizados y correctos."],
  ["auto_new_releases", "Nuevos lanzamientos", "Importa productos recientes de plataformas compatibles.", "09:00", "", "Primeros en nicho con productos nuevos."],
  ["auto_commissions", "Alertas de comisiones", "Registra ventas y comisiones entrantes desde webhooks.", "09:00", "19:00", "Sabes que se esta vendiendo."],
  ["auto_master_agent", "Agente IA Maestro", "Supervisa el sistema y prioriza productos por rendimiento.", "03:00", "", "Sistema optimizado por datos."],
] as const;

async function getAutomationStates() {
  try {
    const rows = await getAdminDb().select<AutomationState>("automation_settings", {
      select: "automation_id,enabled,schedule_cron",
      setup_key: "eq.default",
    });
    return new Map(rows.map((row) => [row.automation_id, row]));
  } catch {
    const localRows = await getLocalAutomationSettings();
    return new Map(localRows.map((row) => [row.automation_id, row]));
  }
}

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input className="peer sr-only" name="enabled" type="checkbox" defaultChecked={enabled} />
      <span className="h-7 w-12 rounded-full bg-white/10 transition peer-checked:bg-[var(--accent-green)]" />
      <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
    </label>
  );
}

export default async function AutomationPage() {
  const states = await getAutomationStates();

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-gold)]">Tus controles</div>
        <h1 className="mt-2 font-display text-3xl font-bold">Las automatizaciones que activas en el sistema</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">Elige cada cuantos dias corre cada tarea y hasta dos horas por dia. Ejemplo: cada 2 dias a las 09:00 y 19:00.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {automations.map(([id, name, description, defaultTime1, defaultTime2, result]) => {
          const state = states.get(id);
          const parsedTimes = state?.times?.length ? state.times : parseTimesFromCron(state?.schedule_cron || "");
          const enabled = state?.enabled ?? true;
          const time1 = parsedTimes[0] || defaultTime1;
          const time2 = parsedTimes[1] || defaultTime2;
          const daysInterval = state?.days_interval || 1;

          return (
            <form key={id} action="/api/automation/run" method="post" className="surface p-5">
              <input type="hidden" name="automation_id" value={id} />
              <div className="flex min-h-full flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-bold">{name}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
                  </div>
                  <Toggle enabled={enabled} />
                </div>

                <div className="grid gap-3 md:grid-cols-[120px_1fr_1fr]">
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Cada dias</span>
                    <input className="input" min="1" max="31" name="days_interval" type="number" defaultValue={daysInterval} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Hora 1</span>
                    <input className="input" name="time_1" type="time" defaultValue={time1} required />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Hora 2 opcional</span>
                    <input className="input" name="time_2" type="time" defaultValue={time2} />
                  </label>
                </div>

                <div className="mt-auto space-y-2">
                  <p className="font-mono text-xs text-[var(--accent-gold)]">
                    {time2 ? `Cada ${daysInterval} dia(s): ${time1} y ${time2}` : `Cada ${daysInterval} dia(s): ${time1}`}
                  </p>
                  <p className="text-xs font-semibold text-[var(--accent-green)]">✓ {result}</p>
                  <p className="text-xs font-bold text-[var(--accent-green)]">{enabled ? "ACTIVO" : "APAGADO"}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button className="btn" name="intent" value="save" type="submit">Guardar horario</button>
                  <button className="btn btn-primary" name="intent" value="run_now" type="submit">Ejecutar ahora</button>
                </div>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
