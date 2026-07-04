"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SETUP_AUTOMATIONS, SETUP_CHECKLIST, SETUP_PLATFORMS } from "@/lib/setup-data";
import type { AutomationId, Platform } from "@/types";

type ProgressItem = {
  platform: Platform;
  completed: boolean;
  connected: boolean;
  completed_at: string | null;
};

type AutomationItem = {
  automation_id: AutomationId;
  enabled: boolean;
  schedule_cron: string;
};

type SetupState = {
  progress: ProgressItem[];
  automations: AutomationItem[];
};

const categoryStyles = {
  physical: "border-[rgba(79,124,245,.28)] bg-[rgba(79,124,245,.08)] text-[#7fa0ff]",
  digital: "border-[rgba(139,92,246,.28)] bg-[rgba(139,92,246,.08)] text-[var(--accent-purple)]",
  network: "border-[rgba(245,166,35,.28)] bg-[rgba(245,166,35,.08)] text-[var(--accent-gold)]",
  dropshipping: "border-[rgba(34,197,94,.28)] bg-[rgba(34,197,94,.08)] text-[var(--accent-green)]",
};

export function SetupDashboard() {
  const [state, setState] = useState<SetupState>({ progress: [], automations: [] });
  const [activePlatform, setActivePlatform] = useState<Platform>("clickbank");
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadState() {
      try {
        setLoading(true);
        const res = await fetch("/api/setup-state", { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok || !payload.ok) throw new Error(payload.error || "No se pudo cargar el progreso.");
        if (mounted) setState({ progress: payload.progress, automations: payload.automations });
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "Error cargando setup.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadState();
    return () => {
      mounted = false;
    };
  }, []);

  const completedCount = useMemo(() => state.progress.filter((item) => item.completed).length, [state.progress]);
  const progressPct = Math.round((completedCount / SETUP_PLATFORMS.length) * 100);

  async function savePlatform(platform: Platform, completed: boolean) {
    setSavingKey(platform);
    setError(null);
    const previous = state.progress;
    setState((current) => ({
      ...current,
      progress: upsertProgress(current.progress, platform, completed),
    }));
    try {
      const res = await fetch("/api/setup-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "platform", platform, completed }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || "No se pudo guardar la plataforma.");
    } catch (saveError) {
      setState((current) => ({ ...current, progress: previous }));
      setError(saveError instanceof Error ? saveError.message : "Error guardando progreso.");
    } finally {
      setSavingKey(null);
    }
  }

  async function saveAutomation(automationId: AutomationId, enabled: boolean, scheduleCron: string) {
    setSavingKey(automationId);
    setError(null);
    const previous = state.automations;
    setState((current) => ({
      ...current,
      automations: upsertAutomation(current.automations, automationId, enabled, scheduleCron),
    }));
    try {
      const res = await fetch("/api/setup-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "automation", automation_id: automationId, enabled, schedule_cron: scheduleCron }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || "No se pudo guardar la automatizacion.");
    } catch (saveError) {
      setState((current) => ({ ...current, automations: previous }));
      setError(saveError instanceof Error ? saveError.message : "Error guardando automatizacion.");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-8 pb-24">
      <header className="surface relative overflow-hidden p-8 md:p-10" data-help="Pantalla de setup principal. Úsala para conectar plataformas y entender el flujo completo.">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,166,35,.16),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,.14),transparent_34%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(245,166,35,.35)] bg-[rgba(245,166,35,.12)] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[.12em] text-[var(--accent-gold)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-green)]" />
            Setup unico automatico
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight md:text-6xl">
            Configuras una vez. <span className="text-[var(--accent-gold)]">AFFILIX trabaja 24/7.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            Conecta plataformas, pega las credenciales necesarias y activa el agente. El sistema guarda el avance, verifica automatizaciones y deja el flujo listo para importar, publicar y medir productos.
          </p>
          <div className="mt-6 inline-flex rounded-xl border border-[rgba(34,197,94,.25)] bg-[rgba(34,197,94,.10)] px-4 py-3 text-sm font-bold text-[var(--accent-green)]">
            Tiempo estimado de setup: 2-3 horas. Trabajo manual despues: 0 horas semanales.
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-[rgba(239,68,68,.35)] bg-[rgba(239,68,68,.10)] p-4 text-sm font-semibold text-[var(--accent-red)]">
          {error}
        </div>
      ) : null}

      <section className="surface p-5" data-help="Barra de progreso de configuración. Sube cuando marcas plataformas como configuradas.">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Progreso de plataformas</h2>
            <p className="text-sm text-[var(--text-secondary)]">{loading ? "Cargando estado guardado..." : "Cada check queda guardado en Supabase mediante `/api/setup-state`."}</p>
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--accent-gold)]">{completedCount}/{SETUP_PLATFORMS.length}</div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--bg-input)]">
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent-gold)] to-[#ff7a1a] transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <div className="font-mono text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-gold)]">Bloque 01</div>
          <h2 className="font-display text-3xl font-bold">Plataformas para afiliados y dropshipping</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Abres cuenta, copias la key y AFFILIX usa la conexion dentro del agente.</p>
        </div>
        <div className="grid gap-4">
          {SETUP_PLATFORMS.map((platform) => {
            const progress = state.progress.find((item) => item.platform === platform.id);
            const completed = Boolean(progress?.completed);
            const active = activePlatform === platform.id;
            return (
              <article key={platform.id} className={`surface overflow-hidden transition ${completed ? "border-[rgba(34,197,94,.35)]" : active ? "border-[rgba(245,166,35,.35)]" : ""}`} data-help={`${platform.name}: ${platform.description}`}>
                <button type="button" data-help="Abre o cierra los pasos de configuración de esta plataforma." onClick={() => setActivePlatform(active ? "clickbank" : platform.id)} className="flex w-full items-center gap-4 p-5 text-left">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${categoryStyles[platform.category]}`}>{platform.logo}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xl font-bold">{platform.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {platform.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 font-mono text-[10px] font-bold text-[var(--text-secondary)]">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="hidden text-right md:block">
                    <div className="font-mono text-sm font-bold text-[var(--accent-green)]">{platform.commission}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">{platform.setupTime} setup</div>
                  </div>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border font-bold ${completed ? "border-[rgba(34,197,94,.4)] bg-[rgba(34,197,94,.14)] text-[var(--accent-green)]" : "border-[var(--border)] text-[var(--text-muted)]"}`}>
                    {completed ? "✓" : active ? "−" : "+"}
                  </div>
                </button>
                {active ? (
                  <div className="border-t border-[var(--border)] p-5">
                    <p className="mb-5 text-sm leading-6 text-[var(--text-secondary)]">{platform.description}</p>
                    <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                      <div className="font-mono text-xs font-bold uppercase tracking-[.15em] text-[var(--accent-gold)]">Credenciales que guarda el sistema</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {platform.requiredKeys.map((key) => (
                          <span key={key} className="rounded-lg bg-[var(--bg-input)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">{key}</span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {platform.steps.map((step, index) => (
                        <div key={step.title} className="flex gap-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(245,166,35,.35)] bg-[rgba(245,166,35,.10)] font-mono text-xs font-bold text-[var(--accent-gold)]">{index + 1}</div>
                          <div>
                            <h4 className="font-bold">{step.title}</h4>
                            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{step.description}</p>
                            {step.link ? <a className="mt-2 inline-flex text-sm font-bold text-[var(--accent-gold)]" href={step.link} target="_blank" rel="noreferrer">Abrir plataforma</a> : null}
                            {step.tip ? <div className="mt-2 rounded-lg border border-[rgba(245,166,35,.25)] bg-[rgba(245,166,35,.08)] p-3 text-xs text-[var(--text-secondary)]">{step.tip}</div> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button type="button" className="btn btn-primary" data-help="Marca esta plataforma como lista o pendiente dentro del progreso de setup." disabled={savingKey === platform.id} onClick={() => savePlatform(platform.id, !completed)}>
                        {completed ? "Marcar pendiente" : "Marcar configurado"}
                      </button>
                      <Link href="/dashboard/accounts" className="btn" data-help="Abre Cuentas conectadas para pegar API keys, tokens y tags reales.">Guardar API keys</Link>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2" data-help="Explica el ciclo automático completo desde descubrimiento hasta actualización de precios.">
          <div className="mb-5">
            <div className="font-mono text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-gold)]">Ciclo 24/7</div>
            <h2 className="font-display text-3xl font-bold">Lo que pasa despues</h2>
          </div>
          <div className="space-y-5">
            {[
              ["09:00", "Descubrimiento automatico", "Consulta APIs conectadas, filtra por rating, precio, reviews, comision y disponibilidad."],
              ["09:15", "Contenido IA", "Genera descripcion, review, pros/contras, titulo SEO y meta descripcion con tu provider configurado."],
              ["09:30", "Publicacion en tienda", "Publica productos activos en /store y crea paginas con tracking en /go/{slug}."],
              ["Tiempo real", "Tracking y comisiones", "Registra clics, fuente, dispositivo y comisiones recibidas por webhook o carga manual."],
              ["Cada 6h", "Precios correctos", "Actualiza precio, pausa productos no disponibles y notifica cambios importantes."],
            ].map(([time, title, description]) => (
              <div key={title} className="flex gap-4">
                <div className="w-24 shrink-0 font-mono text-xs font-bold text-[var(--accent-gold)]">{time}</div>
                <div className="border-l border-[var(--border)] pl-4">
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="surface p-5" data-help="Resumen ejecutivo de lo que queda preparado al terminar el setup.">
          <h2 className="font-display text-2xl font-bold">Resumen</h2>
          <div className="mt-5 grid gap-3">
            {[
              [String(SETUP_PLATFORMS.length), "Plataformas listas para conectar"],
              ["24/7", "Agente trabajando por cron"],
              ["0h", "Trabajo manual semanal despues del setup"],
              ["$0", "Inventario propio necesario"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <div className="font-mono text-3xl font-bold text-[var(--accent-gold)]">{value}</div>
                <div className="mt-1 text-sm text-[var(--text-secondary)]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <div className="font-mono text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-gold)]">Tus controles</div>
          <h2 className="font-display text-3xl font-bold">Automatizaciones del sistema</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {SETUP_AUTOMATIONS.map((automation) => {
            const row = state.automations.find((item) => item.automation_id === automation.id);
            const enabled = row?.enabled ?? true;
            return (
              <div key={automation.id} className="surface p-5" data-help={automation.description}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold">{automation.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{automation.description}</p>
                    <div className="mt-3 font-mono text-xs text-[var(--accent-gold)]">{automation.schedule}</div>
                    <div className="mt-2 text-xs font-semibold text-[var(--accent-green)]">{automation.result}</div>
                  </div>
                  <button
                    type="button"
                    disabled={savingKey === automation.id}
                    onClick={() => saveAutomation(automation.id, !enabled, automation.schedule)}
                    className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-[var(--accent-green)]" : "bg-[var(--text-muted)]"}`}
                    aria-label={`Cambiar ${automation.name}`}
                    data-help="Activa o pausa esta automatización. El estado se guarda en Supabase cuando está configurado."
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface p-5" data-help="Checklist rápido del orden recomendado para poner todo el sistema en marcha.">
        <div className="mb-4">
          <div className="font-mono text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-gold)]">Checklist final</div>
          <h2 className="font-display text-3xl font-bold">Orden exacto para activar todo</h2>
        </div>
        <div className="grid gap-3">
          {SETUP_CHECKLIST.map((item, index) => {
            const checked = Boolean(checkedItems[index]);
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCheckedItems((current) => ({ ...current, [index]: !checked }))}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${checked ? "border-[rgba(34,197,94,.30)] bg-[rgba(34,197,94,.08)] text-[var(--text-secondary)]" : "border-[var(--border)] bg-[var(--bg-elevated)]"}`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${checked ? "border-[var(--accent-green)] bg-[var(--accent-green)] text-white" : "border-[var(--border)] text-[var(--text-muted)]"}`}>✓</span>
                <span className={checked ? "line-through" : ""}>{index + 1}. {item}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="fixed bottom-4 right-4 z-20 rounded-2xl border border-[var(--border)] bg-[rgba(19,19,37,.92)] p-4 shadow-2xl backdrop-blur md:min-w-64">
        <div className="flex items-center gap-3">
          <div className="font-mono text-2xl font-bold text-[var(--accent-gold)]">{completedCount}/{SETUP_PLATFORMS.length}</div>
          <div>
            <div className="text-sm font-bold">Plataformas listas</div>
            <div className="text-xs text-[var(--text-muted)]">{completedCount === SETUP_PLATFORMS.length ? "Setup completo" : "Sigue con la siguiente conexion"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function upsertProgress(progress: ProgressItem[], platform: Platform, completed: boolean) {
  const existing = progress.find((item) => item.platform === platform);
  if (existing) {
    return progress.map((item) => (item.platform === platform ? { ...item, completed } : item));
  }
  return [...progress, { platform, completed, connected: false, completed_at: null }];
}

function upsertAutomation(automations: AutomationItem[], automationId: AutomationId, enabled: boolean, scheduleCron: string) {
  const existing = automations.find((item) => item.automation_id === automationId);
  if (existing) {
    return automations.map((item) => (item.automation_id === automationId ? { ...item, enabled, schedule_cron: scheduleCron } : item));
  }
  return [...automations, { automation_id: automationId, enabled, schedule_cron: scheduleCron }];
}
