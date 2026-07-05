import { providerLabel, isAiAvailable } from "@/lib/ai/provider";

function CapabilityCard({ label, capability }: { label: string; capability: "text" | "image" | "video" | "audio" }) {
  const ok = isAiAvailable(capability);
  return (
    <div className="rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase text-[var(--text-secondary)]">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ok ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-200"}`}>
          {ok ? "Activo" : "Pendiente"}
        </span>
      </div>
      <p className="mt-3 font-mono text-sm">{providerLabel(capability)}</p>
    </div>
  );
}

export default async function AiConfigPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <section className="surface space-y-5 p-6">
        <div>
          <h1 className="font-display text-3xl font-bold">MuAPI</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Proveedor unico para texto, imagen, video y audio. Los modelos de texto se sirven desde MuAPI; otros proveedores solo aparecen si se activan por entorno.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <CapabilityCard label="Texto" capability="text" />
          <CapabilityCard label="Imagen" capability="image" />
          <CapabilityCard label="Video" capability="video" />
          <CapabilityCard label="Audio" capability="audio" />
        </div>
      </section>

      <section className="surface space-y-5 p-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Defaults activos</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Estos defaults se sincronizan con `site_settings.muapi_defaults` en Supabase.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)] p-4"><span className="text-xs uppercase text-[var(--text-secondary)]">Texto</span><p className="mt-2 font-mono">claude-sonnet-4-6</p></div>
          <div className="rounded-lg border border-[var(--border)] p-4"><span className="text-xs uppercase text-[var(--text-secondary)]">Imagen</span><p className="mt-2 font-mono">flux-dev</p></div>
          <div className="rounded-lg border border-[var(--border)] p-4"><span className="text-xs uppercase text-[var(--text-secondary)]">Video</span><p className="mt-2 font-mono">kling-pro</p></div>
          <div className="rounded-lg border border-[var(--border)] p-4"><span className="text-xs uppercase text-[var(--text-secondary)]">Audio</span><p className="mt-2 font-mono">suno-music</p></div>
        </div>
      </section>

      <form action="/api/internal/muapi/sync-models" method="post" className="surface flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Catalogo MuAPI</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Sincroniza modelos de texto, imagen, video y audio.</p>
        </div>
        <button className="btn btn-primary" type="submit">Sincronizar modelos</button>
      </form>
    </div>
  );
}
