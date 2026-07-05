import Link from "next/link";
import { getBalance } from "@/lib/muapi/client";

const categories = [
  { id: "image", label: "Imagen", endpoint: process.env.MUAPI_DEFAULT_IMAGE_MODEL || "flux-dev" },
  { id: "video", label: "Video", endpoint: process.env.MUAPI_DEFAULT_VIDEO_MODEL || "kling-pro" },
  { id: "audio", label: "Audio", endpoint: process.env.MUAPI_DEFAULT_AUDIO_MODEL || "suno-music" },
  { id: "enhance", label: "Enhance", endpoint: "upscale" },
  { id: "edit", label: "Edit", endpoint: "bg-remove" },
  { id: "avatar", label: "Avatar", endpoint: "latentsync" },
  { id: "3d", label: "3D", endpoint: "tripo3d" },
];

async function getMuapiBalance() {
  try {
    return await getBalance();
  } catch {
    return null;
  }
}

export default async function MediaStudioPage() {
  const balance = await getMuapiBalance();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-gold)]">MuAPI</div>
          <h1 className="mt-2 font-display text-3xl font-bold">Media Studio</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
            Genera imagen, video, audio y assets multimedia. El resultado final aparece en Jobs de Media Studio, se guarda en muapi_jobs.output_urls y, cuando MuAPI entrega archivo descargable, AFFILIX lo copia a storage privado.
          </p>
        </div>
        <div className="surface px-4 py-3 text-sm">
          <span className="text-[var(--text-secondary)]">Balance MuAPI</span>
          <strong className="ml-2 text-[var(--accent-green)]">{balance ? `$${balance.balance_usd.toFixed(2)} USD` : "No disponible"}</strong>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <form action="/api/muapi/submit" method="post" className="surface space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold">Categoria</span>
              <select className="input" name="category" defaultValue="image">
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">Endpoint / modelo</span>
              <input className="input" name="endpoint" defaultValue={process.env.MUAPI_DEFAULT_IMAGE_MODEL || "flux-dev"} required />
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-sm font-bold">Prompt</span>
            <textarea className="input min-h-36" name="prompt" placeholder="Describe el asset que quieres generar para AFFILIX." required />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-bold">Aspect ratio</span>
              <select className="input" name="aspect_ratio" defaultValue="16:9">
                <option value="1:1">1:1</option>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="4:5">4:5</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">Duracion</span>
              <input className="input" min="1" max="120" name="duration" type="number" defaultValue="8" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">Coste estimado USD</span>
              <input className="input" min="0" step="0.0001" name="estimated_cost_usd" type="number" defaultValue="0" />
            </label>
          </div>

          <input type="hidden" name="origin" value="media_studio" />
          <button className="btn btn-primary" type="submit">Generar con MuAPI</button>
        </form>

        <aside className="surface space-y-4 p-5">
          <h2 className="font-display text-xl font-bold">Donde se entrega</h2>
          <Link className="btn w-full justify-center" href="/dashboard/media-studio/jobs">Ver historial de jobs</Link>
          <form action="/api/internal/muapi/sync-models" method="post">
            <button className="btn w-full" type="submit">Sincronizar catalogo</button>
          </form>
          <div className="rounded-lg border border-[var(--border)] p-4 text-xs leading-5 text-[var(--text-secondary)]">
            Flujo: escribes prompt, generas con MuAPI, revisas el job, descargas el output o lo usas dentro de un producto, servicio o campana.
          </div>
        </aside>
      </section>
    </div>
  );
}
