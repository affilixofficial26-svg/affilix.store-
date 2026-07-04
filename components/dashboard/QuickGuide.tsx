const guideSteps = [
  ["1", "Setup AFFILIX", "Conecta plataformas y marca el progreso de configuración."],
  ["2", "Cuentas conectadas", "Guarda API keys, tags y tokens de afiliados o dropshipping."],
  ["3", "Config IA", "Elige proveedor, modelo y API key para generar contenido."],
  ["4", "Descubrir nuevos", "Busca productos rentables por nicho y plataforma."],
  ["5", "Agente IA", "Ejecuta el ciclo completo y revisa logs."],
  ["6", "Analytics", "Mide clics, comisiones y productos que mejor convierten."],
];

export function QuickGuide() {
  return (
    <section className="surface p-5" data-help="Guía rápida del sistema. Sigue estos pasos para poner AFFILIX en marcha sin perderte.">
      <div className="font-display text-lg font-bold">Guía rápida del sistema</div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {guideSteps.map(([number, title, description]) => (
          <div key={number} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4" data-help={description}>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-gold-glow)] font-mono text-sm font-bold text-[var(--accent-gold)]">{number}</span>
              <strong>{title}</strong>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
