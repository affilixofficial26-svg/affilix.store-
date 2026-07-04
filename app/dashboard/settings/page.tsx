import { getLocalAiConfig } from "@/lib/local-ai-config";

const currencies = [
  { value: "EUR", label: "EUR - Euro" },
  { value: "USD", label: "USD - Dolar" },
  { value: "MXN", label: "MXN - Peso mexicano" },
];

const messages: Record<string, { tone: string; text: string }> = {
  ok: { tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200", text: "Configuracion general guardada correctamente." },
  invalid: { tone: "border-red-500/40 bg-red-500/10 text-red-200", text: "Revisa el nombre de tienda y la moneda antes de guardar." },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ settings?: string }>;
}) {
  const config = await getLocalAiConfig();
  const params = searchParams ? await searchParams : {};
  const message = params.settings ? messages[params.settings] : null;
  const storeName = config.store_name || "AFFILIX";
  const storeSlug = config.store_slug || "affilix";
  const currency = config.currency || "EUR";

  return (
    <div className="space-y-6">
      <header className="surface p-6">
        <div className="font-mono text-xs uppercase text-[var(--accent-gold)]">Ajustes de tienda</div>
        <h1 className="font-display mt-2 text-3xl font-bold">Configuracion general</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">
          Aqui defines los datos basicos de AFFILIX: nombre comercial, identificador publico y moneda principal del panel.
        </p>
      </header>

      {message ? <div className={`rounded-xl border px-4 py-3 text-sm ${message.tone}`}>{message.text}</div> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface p-5">
          <div className="text-xs text-[var(--text-muted)]">Nombre actual</div>
          <div className="mt-2 font-display text-2xl font-bold">{storeName}</div>
        </div>
        <div className="surface p-5">
          <div className="text-xs text-[var(--text-muted)]">Slug publico</div>
          <div className="mt-2 font-mono text-2xl">{storeSlug}</div>
        </div>
        <div className="surface p-5">
          <div className="text-xs text-[var(--text-muted)]">Moneda</div>
          <div className="mt-2 font-mono text-2xl">{currency}</div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <form action="/api/settings/general" method="post" className="surface space-y-4 p-6">
          <div>
            <h2 className="font-display text-xl font-bold">Datos principales</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Estos datos se usan en el panel y como base para enlaces internos.</p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">Nombre de la tienda</span>
            <input className="input" name="store_name" defaultValue={storeName} placeholder="Ejemplo: AFFILIX Store" required />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">Slug publico</span>
            <input className="input" name="store_slug" defaultValue={storeSlug} placeholder="affilix-store" />
            <span className="mt-2 block text-xs text-[var(--text-muted)]">Si lo dejas vacio, se genera desde el nombre.</span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">Moneda principal</span>
            <select className="input" name="currency" defaultValue={currency}>
              {currencies.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>

          <button className="btn btn-primary w-full" type="submit">Guardar configuracion</button>
        </form>

        <aside className="surface p-6">
          <h2 className="font-display text-xl font-bold">Para que sirve</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
            <div className="rounded-xl bg-[var(--bg-elevated)] p-4">
              <strong className="text-white">Nombre</strong>
              <p className="mt-1">Identifica la tienda dentro del panel y en configuraciones generales.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] p-4">
              <strong className="text-white">Slug</strong>
              <p className="mt-1">Version limpia del nombre para enlaces internos y referencias publicas.</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] p-4">
              <strong className="text-white">Moneda</strong>
              <p className="mt-1">Define como se muestran metricas, presupuestos y comisiones dentro del panel.</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
