import { getAdminDb } from "@/lib/supabase";
import { BudgetPicker } from "@/components/marketing/BudgetPicker";
import { money } from "@/lib/utils";
import type { MetaCampaign, MetaConfig } from "@/lib/marketing/types";

async function getData() {
  try {
    const [config, campaigns] = await Promise.all([
      getAdminDb().select<MetaConfig>("meta_config", { select: "*", user_id: "is.null", limit: "1" }),
      getAdminDb().select<MetaCampaign>("meta_campaigns", { select: "*", order: "created_at.desc", limit: "40" }),
    ]);
    return { config: config[0] || null, campaigns };
  } catch {
    return { config: null, campaigns: [] };
  }
}

function ConnectionStatus({ config }: { config: MetaConfig | null }) {
  const missing = [
    !config?.access_token ? "Access token" : null,
    !config?.ad_account_id ? "Ad Account ID" : null,
    !config?.page_id ? "Page ID" : null,
  ].filter(Boolean);

  if (!missing.length) {
    return <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">Lista para probar</span>;
  }
  return <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-200">Checklist</span>;
}

export default async function MetaAdsPage({
  searchParams,
}: {
  searchParams?: Promise<{ meta_test?: string; message?: string }>;
}) {
  const { config, campaigns } = await getData();
  const params = searchParams ? await searchParams : {};
  const budget = Number(config?.monthly_budget || 50);
  const spent = campaigns.reduce((sum, item) => sum + Number(item.total_spent || 0), 0);
  const tokenSaved = Boolean(config?.access_token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Meta Ads</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Conecta Meta, define presupuesto y controla campanas para productos top.</p>
      </div>

      {params.meta_test ? (
        <div className={`surface p-4 text-sm ${params.meta_test === "ok" ? "text-emerald-300" : "text-red-300"}`}>
          {params.meta_test === "ok" ? "Meta Ads verificado: token, cuenta publicitaria y pagina respondieron correctamente." : `Meta Ads con fallo: ${params.message || "revisa token, cuenta publicitaria o pagina."}`}
        </div>
      ) : null}

      <section className="surface p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl font-bold">Guia rapida de conexion</h2>
              <ConnectionStatus config={config} />
            </div>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">
              Para crear anuncios reales necesitas un token de Meta con permisos de anuncios, el ID de la cuenta publicitaria, el Page ID y opcionalmente el Pixel ID. Las campanas se crean pausadas para que puedas revisarlas antes de gastar dinero.
            </p>
          </div>
          <form action="/api/marketing/meta/test" method="post">
            <button className="btn btn-primary" type="submit">Probar conexion Meta</button>
          </form>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-[var(--bg-elevated)] p-4 text-sm"><div className="font-bold">1. Token</div><p className="mt-1 text-[var(--text-secondary)]">Pega un access token de Meta Business con acceso a Ads.</p></div>
          <div className="rounded-xl bg-[var(--bg-elevated)] p-4 text-sm"><div className="font-bold">2. Cuenta</div><p className="mt-1 text-[var(--text-secondary)]">Ejemplo: act_123456789 o 123456789.</p></div>
          <div className="rounded-xl bg-[var(--bg-elevated)] p-4 text-sm"><div className="font-bold">3. Pagina</div><p className="mt-1 text-[var(--text-secondary)]">Page ID de Facebook que publicara los anuncios.</p></div>
          <div className="rounded-xl bg-[var(--bg-elevated)] p-4 text-sm"><div className="font-bold">4. Prueba</div><p className="mt-1 text-[var(--text-secondary)]">Pulsa Probar conexion Meta antes de crear campanas.</p></div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <form action="/api/marketing/meta/config" method="post" className="surface grid gap-3 p-5">
          <h2 className="font-display text-xl font-bold">Conexion Meta</h2>
          <input className="input" name="access_token" placeholder={tokenSaved ? "Token guardado; pega uno nuevo solo si quieres cambiarlo" : "Meta access token"} />
          <input className="input" name="ad_account_id" placeholder="Ad account ID / act_..." defaultValue={config?.ad_account_id || ""} />
          <input className="input" name="page_id" placeholder="Page ID" defaultValue={config?.page_id || ""} />
          <input className="input" name="pixel_id" placeholder="Pixel ID" defaultValue={config?.pixel_id || ""} />
          <label className="flex items-center gap-2 text-sm"><input name="auto_distribute" type="checkbox" defaultChecked={config?.auto_distribute ?? true} /> Auto-crear anuncios para top productos</label>
          <input className="input" name="min_priority_score" type="number" min="1" max="10" step="0.1" defaultValue={config?.min_priority_score || 7} />
          <button className="btn btn-primary" type="submit">Guardar Meta Ads</button>
        </form>

        <div className="surface p-5">
          <h2 className="font-display text-xl font-bold">Distribuidor de presupuesto</h2>
          <form action="/api/marketing/meta/config" method="post" className="mt-4 grid gap-3">
            <input type="hidden" name="access_token" value="" />
            <input type="hidden" name="ad_account_id" value={config?.ad_account_id || ""} />
            <input type="hidden" name="page_id" value={config?.page_id || ""} />
            <input type="hidden" name="pixel_id" value={config?.pixel_id || ""} />
            <input type="hidden" name="auto_distribute" value={config?.auto_distribute ?? true ? "on" : ""} />
            <input type="hidden" name="min_priority_score" value={config?.min_priority_score || 7} />
            <BudgetPicker budget={budget} />
            <button className="btn btn-primary" type="submit">Actualizar presupuesto</button>
          </form>
          <form action="/api/marketing/meta/rebalance" method="post" className="mt-3">
            <input type="hidden" name="totalBudget" value={budget} />
            <button className="btn w-full" type="submit">Redistribuir campanas activas</button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Campanas</div><div className="mt-2 font-mono text-3xl">{campaigns.length}</div></div>
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">Gasto</div><div className="mt-2 font-mono text-3xl">{money(spent, "EUR")}</div></div>
        <div className="surface p-5"><div className="text-xs text-[var(--text-muted)]">CTR medio</div><div className="mt-2 font-mono text-3xl">{campaigns.length ? (campaigns.reduce((s, c) => s + Number(c.ctr || 0), 0) / campaigns.length).toFixed(2) : "0"}%</div></div>
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-[var(--border)] p-5"><h2 className="font-display text-xl font-bold">Campanas activas e historial</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-[var(--bg-elevated)] text-xs uppercase text-[var(--text-muted)]">
              <tr><th className="px-5 py-3">Campaign ID</th><th className="px-5 py-3">Budget diario</th><th className="px-5 py-3">Clicks</th><th className="px-5 py-3">Impresiones</th><th className="px-5 py-3">CTR</th><th className="px-5 py-3">Estado</th></tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-t border-[var(--border)]">
                  <td className="px-5 py-4 font-mono">{campaign.campaign_id}</td>
                  <td className="px-5 py-4">{money(campaign.daily_budget, "EUR")}</td>
                  <td className="px-5 py-4">{campaign.total_clicks}</td>
                  <td className="px-5 py-4">{campaign.total_impressions}</td>
                  <td className="px-5 py-4">{campaign.ctr}</td>
                  <td className="px-5 py-4">{campaign.status}</td>
                </tr>
              ))}
              {!campaigns.length ? <tr><td className="px-5 py-8 text-center text-[var(--text-secondary)]" colSpan={6}>Todavia no hay campanas creadas.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
