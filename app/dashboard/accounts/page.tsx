import { getProviderAccountMap } from "@/lib/platform-accounts";
import { SETUP_PLATFORMS } from "@/lib/setup-data";
import { ExternalPlatformConnectForm } from "@/components/accounts/ExternalPlatformConnectForm";

export const dynamic = "force-dynamic";

function Status({ connected, status }: { connected: boolean; status?: "success" | "error" | null }) {
  if (connected && status === "success") {
    return <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">Conectada 100%</span>;
  }
  if (status === "error") {
    return <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-300">Fallo</span>;
  }
  return (
    <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-xs font-bold text-cyan-200">Listo para conectar</span>
  );
}

function fieldPlaceholder(keys: string[], index: number) {
  if (!keys.length) return index === 0 ? "API key / access key / token" : "Secret / tag / publisher ID / website ID";
  if (index === 0) return keys[0];
  return keys.slice(1).join(" | ");
}

export default async function AccountsPage() {
  const accountMap = await getProviderAccountMap();

  return (
    <div className="space-y-6">
      <div data-help="Aqui conectas plataformas externas. El boton de login abre la web oficial y registra la conexion en el panel local.">
        <h1 className="font-display text-3xl font-bold">Cuentas conectadas</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Entra o registrate en cada plataforma desde AFFILIX. Si ya tienes API keys, tambien puedes guardarlas manualmente.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SETUP_PLATFORMS.map((platform) => {
          const account = accountMap.get(platform.id);
          const connected = Boolean(account?.connected);
          const status = account?.last_test_status;
          const updated = account?.updated_at ? new Date(account.updated_at).toLocaleString("es-ES") : null;

          return (
            <section key={platform.id} className="surface flex flex-col p-5" data-help={`Conexion de ${platform.name}: ${platform.description}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">{platform.name}</h2>
                  <p className="mt-1 min-h-10 text-sm text-[var(--text-secondary)]">{platform.description}</p>
                </div>
                <Status connected={connected} status={status} />
              </div>

              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[var(--accent-gold)]">Datos requeridos</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {platform.requiredKeys.map((key) => (
                    <span key={key} className="rounded-lg bg-[var(--bg-input)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">{key}</span>
                  ))}
                </div>
              </div>

              <ExternalPlatformConnectForm platform={platform.id} platformName={platform.name} signupUrl={platform.signupUrl} />

              <form action="/api/accounts/connect" method="post" className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4">
                <input type="hidden" name="platform" value={platform.id} />
                <input type="hidden" name="connect_mode" value="manual_credentials" />
                <input className="input" data-help="Clave principal de la plataforma: API key, access key o token." name="primary_key" placeholder={fieldPlaceholder(platform.requiredKeys, 0)} />
                <input className="input" data-help="Dato secundario: secret, associate tag, publisher ID o website ID." name="secondary_key" placeholder={fieldPlaceholder(platform.requiredKeys, 1)} />
                <button className="btn" data-help="Guarda credenciales si ya las tienes disponibles." type="submit">Guardar credenciales</button>
              </form>

              <form action="/api/accounts/test" method="post" className="mt-3">
                <input type="hidden" name="platform" value={platform.id} />
                <button className="btn w-full" type="submit">Probar conexion real</button>
              </form>

              <div className={`mt-4 rounded-xl border p-3 text-xs leading-5 ${connected && status === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : status === "error" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-amber-500/30 bg-amber-500/10 text-amber-100"}`}>
                <p className="font-bold">{connected && status === "success" ? "Proveedor listo para productos reales." : "Proveedor listo para guardar credenciales y probar conexion."}</p>
                <p className="mt-1">{account?.last_test_message || "Abre el proveedor, guarda credenciales API y pulsa Probar conexion real."}</p>
                {updated ? <p className="mt-2 text-[var(--text-secondary)]">Ultima revision: {updated}</p> : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
