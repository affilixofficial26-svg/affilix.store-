import { getAdminDb } from "@/lib/supabase";
import type { SocialConfig } from "@/lib/marketing/types";

async function getConfig() {
  try {
    return (await getAdminDb().select<SocialConfig>("social_accounts", { select: "*", user_id: "is.null", limit: "1" }))[0] || null;
  } catch {
    return null;
  }
}

function Status({ active }: { active?: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-[var(--text-secondary)]"}`}>{active ? "Conectada" : "Lista para conectar"}</span>;
}

export default async function SocialAccountsPage() {
  const config = await getConfig();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Cuentas sociales</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Guarda tokens server-side para publicar productos automáticamente en redes.</p>
      </div>

      <form action="/api/marketing/social-accounts" method="post" className="grid gap-4 xl:grid-cols-2">
        <section className="surface p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Facebook Page</h2><Status active={config?.facebook_enabled} /></div>
          <div className="mt-4 grid gap-3">
            <label className="flex items-center gap-2 text-sm"><input name="facebook_enabled" type="checkbox" defaultChecked={config?.facebook_enabled} /> Activar Facebook</label>
            <input className="input" name="facebook_page_id" placeholder="Facebook Page ID" defaultValue={config?.facebook_page_id || ""} />
            <input className="input" name="facebook_page_token" placeholder="Page access token" />
            <p className="text-xs text-[var(--text-secondary)]">Meta for Developers &gt; Graph API Explorer &gt; Page token con permisos pages_manage_posts.</p>
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Instagram Business</h2><Status active={config?.instagram_enabled} /></div>
          <div className="mt-4 grid gap-3">
            <label className="flex items-center gap-2 text-sm"><input name="instagram_enabled" type="checkbox" defaultChecked={config?.instagram_enabled} /> Activar Instagram</label>
            <input className="input" name="instagram_business_id" placeholder="Instagram Business ID" defaultValue={config?.instagram_business_id || ""} />
            <input className="input" name="instagram_token" placeholder="Instagram / Meta token" />
            <p className="text-xs text-[var(--text-secondary)]">La cuenta debe ser Business y estar conectada a una Page de Facebook.</p>
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Pinterest</h2><Status active={config?.pinterest_enabled} /></div>
          <div className="mt-4 grid gap-3">
            <label className="flex items-center gap-2 text-sm"><input name="pinterest_enabled" type="checkbox" defaultChecked={config?.pinterest_enabled} /> Activar Pinterest</label>
            <input className="input" name="pinterest_board_id" placeholder="Board ID" defaultValue={config?.pinterest_board_id || ""} />
            <input className="input" name="pinterest_token" placeholder="Pinterest API token" />
            <p className="text-xs text-[var(--text-secondary)]">Pinterest Developers &gt; App &gt; OAuth token con permiso pins:write.</p>
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">X / Twitter</h2><Status active={config?.twitter_enabled} /></div>
          <div className="mt-4 grid gap-3">
            <label className="flex items-center gap-2 text-sm"><input name="twitter_enabled" type="checkbox" defaultChecked={config?.twitter_enabled} /> Activar X</label>
            <input className="input" name="twitter_bearer_token" placeholder="Bearer / OAuth token" />
            <input className="input" name="twitter_api_key" placeholder="API key" />
            <input className="input" name="twitter_api_secret" placeholder="API secret" />
          </div>
        </section>

        <div className="flex flex-wrap gap-3 xl:col-span-2">
          <button className="btn btn-primary" type="submit">Guardar cuentas sociales</button>
          <button className="btn" formAction="/api/marketing/social-accounts/test" formMethod="post" type="submit">Probar conexión</button>
        </div>
      </form>
    </div>
  );
}
