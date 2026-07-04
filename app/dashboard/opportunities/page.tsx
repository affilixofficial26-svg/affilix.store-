import { BUSINESS_OPPORTUNITIES, OPPORTUNITY_LEVELS, type OpportunityLevel } from "@/lib/business-opportunities";

const levelOrder: OpportunityLevel[] = ["oro", "plata", "bronce"];

const levelClasses: Record<OpportunityLevel, string> = {
  oro: "border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]",
  plata: "border-slate-400/40 bg-slate-400/10 text-slate-200",
  bronce: "border-orange-400/40 bg-orange-400/10 text-orange-200",
};

export default function OpportunitiesPage() {
  const priority = BUSINESS_OPPORTUNITIES.filter((item) => item.priority);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Oportunidades de negocio</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
            Ideas del documento AFFILIX organizadas por impacto, coste y tiempo. Esto no activa funciones nuevas: sirve para decidir y ejecutar con orden.
          </p>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-center text-xs">
          <div className="px-4 py-3"><div className="font-mono text-lg text-white">{BUSINESS_OPPORTUNITIES.length}</div><div className="text-[var(--text-muted)]">Ideas</div></div>
          <div className="border-x border-[var(--border)] px-4 py-3"><div className="font-mono text-lg text-[var(--accent-gold)]">{priority.length}</div><div className="text-[var(--text-muted)]">Prioridad</div></div>
          <div className="px-4 py-3"><div className="font-mono text-lg text-emerald-300">$0</div><div className="text-[var(--text-muted)]">Muchas ideas</div></div>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        {priority.map((item) => (
          <a key={item.id} href={`#${item.id}`} className="surface block p-4 transition hover:border-[var(--border-hover)]">
            <div className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${levelClasses[item.level]}`}>{OPPORTUNITY_LEVELS[item.level].title}</div>
            <h2 className="mt-3 font-display text-lg font-bold">{item.title}</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{item.potential}</p>
          </a>
        ))}
      </section>

      <section className="surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">Ejemplo de uso</div>
            <h2 className="mt-3 font-display text-xl font-bold">Como usar este panel para crear una oportunidad real</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
              Este panel ayuda a elegir una idea rentable, no publica solo. El usuario escoge una oportunidad, conecta el proveedor correspondiente, importa productos reales y luego activa marketing o automatizacion.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-[.14em] text-[var(--text-muted)]">Ruta sugerida</div>
            <div className="font-mono text-sm text-white">Oportunidad | Proveedor | Producto | Marketing</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
            <div className="font-mono text-xs font-bold text-[var(--accent-gold)]">1</div>
            <h3 className="mt-2 text-sm font-bold">Elegir idea</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Ejemplo: Afiliados de herramientas IA porque puede generar comisiones recurrentes.</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
            <div className="font-mono text-xs font-bold text-[var(--accent-gold)]">2</div>
            <h3 className="mt-2 text-sm font-bold">Conectar proveedor</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Ir a Proveedores, guardar API o enlace aprobado de Hotmart, Gumroad, ClickBank u otro proveedor real.</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
            <div className="font-mono text-xs font-bold text-[var(--accent-gold)]">3</div>
            <h3 className="mt-2 text-sm font-bold">Publicar producto</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Importar el producto, subir o capturar la foto oficial y confirmar que aparece en la tienda publica.</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
            <div className="font-mono text-xs font-bold text-[var(--accent-gold)]">4</div>
            <h3 className="mt-2 text-sm font-bold">Promocionar</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Usar Contenido IA o Marketing para crear textos, posts y campanas sobre ese producto.</p>
          </div>
        </div>
      </section>

      {levelOrder.map((level) => {
        const opportunities = BUSINESS_OPPORTUNITIES.filter((item) => item.level === level);
        return (
          <section key={level} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-2">
              <div>
                <h2 className="font-display text-xl font-bold">Nivel {OPPORTUNITY_LEVELS[level].title}</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{OPPORTUNITY_LEVELS[level].detail}</p>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{opportunities.length} ideas</span>
            </div>

            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {opportunities.map((item) => (
                <article id={item.id} key={item.id} className="surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${levelClasses[item.level]}`}>{item.priority ? "Prioritario" : OPPORTUNITY_LEVELS[item.level].title}</div>
                      <h3 className="mt-3 font-display text-lg font-bold">{item.title}</h3>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-right">
                      <div className="text-[10px] uppercase tracking-[.14em] text-[var(--text-muted)]">Tiempo</div>
                      <div className="font-mono text-sm text-white">{item.time}</div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{item.summary}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
                      <div className="text-[var(--text-muted)]">Potencial</div>
                      <div className="mt-1 font-bold text-emerald-300">{item.potential}</div>
                    </div>
                    <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
                      <div className="text-[var(--text-muted)]">Coste</div>
                      <div className="mt-1 font-bold text-[var(--accent-gold)]">{item.cost}</div>
                    </div>
                  </div>

                  <details className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-bold">Como implementarlo</summary>
                    <ol className="space-y-2 border-t border-[var(--border)] p-3 text-xs leading-5 text-[var(--text-secondary)]">
                      {item.actions.map((action) => <li key={action}>{action}</li>)}
                    </ol>
                  </details>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.examples.map((example) => (
                      <span key={example} className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-secondary)]">{example}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
