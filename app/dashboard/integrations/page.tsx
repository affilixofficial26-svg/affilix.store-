const integrations = [
  ["Supabase", "Base de datos, storage privado y entregas.", ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]],
  ["Pagos", "Checkout y confirmación mediante webhook.", ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]],
  ["Correo", "Recibos, entregas y seguimiento.", ["RESEND_API_KEY", "EMAIL_FROM"]],
  ["IA", "Texto, imagen y ejecución de servicios.", ["Configuración guardada en el panel de IA"]],
  ["Social y Ads", "Publicación, promoción y analítica.", ["Tokens guardados en Marketing"]],
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Integraciones</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Servicios que sostienen cobro, entrega, IA y crecimiento.</p></div>
      <div className="grid gap-4 lg:grid-cols-2">
        {integrations.map(([name, description, requirements]) => (
          <section key={name as string} className="surface p-5">
            <h2 className="font-display text-xl font-bold">{name as string}</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{description as string}</p>
            <div className="mt-4 space-y-2">{(requirements as string[]).map((requirement) => <div key={requirement} className="rounded-md bg-[var(--bg-input)] px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{requirement}</div>)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

