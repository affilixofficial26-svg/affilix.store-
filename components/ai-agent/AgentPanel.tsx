"use client";

import { useEffect, useMemo, useState } from "react";

type AgentStep = {
  title?: string;
  detail?: string;
  errors?: string[];
  products?: AgentProduct[];
};

type AgentResponse = {
  ok?: boolean;
  title?: string;
  message?: string;
  error?: string;
  detail?: string;
  duration_ms?: number;
  steps?: AgentStep[];
};

type AgentProduct = {
  id: string;
  title: string;
  platform: string;
  category: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
  slug: string;
  is_active: boolean;
  is_featured: boolean;
  auto_published: boolean;
};

type AgentStatus = {
  providers: Array<{ platform: string; connected: boolean; last_test_status: string | null }>;
  products: AgentProduct[];
  ai: {
    text_provider: string | null;
    text_model: string | null;
    image_provider: string | null;
    image_model: string | null;
    has_text_key: boolean;
    has_image_key: boolean;
  };
};

const controls = [
  {
    action: "run_full_cycle",
    label: "Ejecutar ciclo completo",
    help: "Busca productos, revisa precios, genera contenido, completa imagenes y guarda el historial.",
    primary: true,
  },
  {
    action: "discover_products",
    label: "Buscar productos",
    help: "Busca oportunidades en proveedores conectados. Si no hay API real, usa el catalogo local para dejar productos listos.",
  },
  {
    action: "update_prices",
    label: "Revisar precios",
    help: "Marca productos como revisados y prepara el sistema para actualizar precios vivos cuando el proveedor tenga API conectada.",
  },
  {
    action: "generate_content",
    label: "Generar contenido",
    help: "Crea textos de marketing, anuncios y SEO para los productos activos usando la IA configurada.",
  },
  {
    action: "generate_images",
    label: "Completar imagenes",
    help: "Intenta generar o completar fotos de productos que todavia no tienen imagen.",
  },
];

async function runAgent(payload: Record<string, string>) {
  const response = await fetch("/api/ai/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({ error: "Respuesta no valida del servidor" }));
  if (!response.ok) return { ...data, ok: false } as AgentResponse;
  return data as AgentResponse;
}

async function postJson(path: string, body: Record<string, string | boolean>) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({ error: "Respuesta no valida del servidor" }));
  if (!response.ok) throw new Error(String(data.error || data.detail || "Accion no completada"));
  return data;
}

function formatMoney(value: number | null, currency: string) {
  if (value === null || Number.isNaN(Number(value))) return "Precio no disponible";
  return `${Number(value).toFixed(2)} ${currency || "USD"}`;
}

export function AgentPanel() {
  const [message, setMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [productAction, setProductAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const resultProducts = useMemo(() => {
    const map = new Map<string, AgentProduct>();
    result?.steps?.forEach((step) => step.products?.forEach((product) => map.set(product.id, product)));
    status?.products.forEach((product) => {
      if (!map.has(product.id)) map.set(product.id, product);
    });
    return Array.from(map.values()).slice(0, 18);
  }, [result, status]);

  useEffect(() => {
    fetch("/api/ai/agent", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  async function submit(action: string) {
    setLoadingAction(action);
    setResult(null);
    try {
      setResult(await runAgent({ action, message }));
      fetch("/api/ai/agent", { cache: "no-store" })
        .then((response) => response.json())
        .then((data) => setStatus(data))
        .catch(() => undefined);
    } catch (error) {
      setResult({
        ok: false,
        error: "No se pudo contactar con el agente.",
        detail: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setLoadingAction(null);
    }
  }

  async function runProductAction(product: AgentProduct, action: "publish" | "content" | "image" | "provider-image") {
    const actionKey = `${action}:${product.id}`;
    setProductAction(actionKey);
    setNotice(null);
    try {
      if (action === "publish") await postJson("/api/products/publish", { product_id: product.id });
      if (action === "content") await postJson("/api/ai/generate-content", { product_id: product.id, force_image: false });
      if (action === "image") await postJson("/api/ai/generate-product-image", { product_id: product.id, force: true });
      if (action === "provider-image") await postJson("/api/products/fetch-provider-image", { product_id: product.id });
      setNotice("Accion completada correctamente.");
      const fresh = await fetch("/api/ai/agent", { cache: "no-store" }).then((response) => response.json());
      setStatus(fresh);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo completar la accion.");
    } finally {
      setProductAction(null);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
      <section className="surface p-5" data-help="Panel principal del agente. Aqui escribes una orden normal y AFFILIX la convierte en una accion real.">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Agente IA</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Ejecuta busqueda, precios, contenido, imagenes y publicacion desde un solo panel.
            </p>
          </div>
          <a className="btn" href="/dashboard/settings/ai-config">Config IA</a>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Texto IA</div>
            <div className="mt-2 font-bold">{status?.ai.text_provider || "Sin proveedor"}</div>
            <div className="text-xs text-[var(--text-secondary)]">{status?.ai.text_model || "Modelo no definido"}</div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Imagen IA</div>
            <div className="mt-2 font-bold">{status?.ai.image_provider || "Sin proveedor"}</div>
            <div className="text-xs text-[var(--text-secondary)]">{status?.ai.image_model || "Modelo no definido"}</div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Proveedores</div>
            <div className="mt-2 font-bold">{status?.providers.length ?? 0} conectados</div>
            <div className="text-xs text-[var(--text-secondary)]">{status?.providers.map((item) => item.platform).slice(0, 4).join(", ") || "Pendiente de conexion real"}</div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <textarea
            className="input min-h-40 py-3"
            data-help="Ejemplo: busca productos de mascotas, genera contenido SEO o completa imagenes."
            name="message"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Orden para el agente..."
            value={message}
          />
          <button
            className="btn btn-primary"
            data-help="Envia tu orden al agente y ejecuta una accion real en el backend."
            disabled={Boolean(loadingAction)}
            onClick={() => submit("run_full_cycle")}
            type="button"
          >
            {loadingAction === "run_full_cycle" ? "Ejecutando..." : "Enviar al agente"}
          </button>
        </div>

        {result ? (
          <div className={`mt-5 rounded-xl border p-4 text-sm ${result.ok ? "border-[rgba(34,197,94,.35)] bg-[rgba(34,197,94,.08)]" : "border-[rgba(239,68,68,.35)] bg-[rgba(239,68,68,.08)]"}`}>
            <h2 className="font-display text-xl font-bold">{result.ok ? result.title || "Agente terminado" : result.error || "Error del agente"}</h2>
            <p className="mt-2 text-[var(--text-secondary)]">{result.ok ? result.message : result.detail}</p>
            {typeof result.duration_ms === "number" ? (
              <p className="mt-2 text-xs font-bold text-[var(--text-muted)]">Tiempo: {Math.round(result.duration_ms / 1000)} segundos</p>
            ) : null}
            {Array.isArray(result.steps) && result.steps.length ? (
              <div className="mt-4 grid gap-2">
                {result.steps.map((step, index) => (
                  <div key={`${step.title || "paso"}-${index}`} className="rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,.03)] p-3">
                    <div className="font-bold">{step.title || `Paso ${index + 1}`}</div>
                    <div className="mt-1 text-[var(--text-secondary)]">{step.detail || "Completado."}</div>
                    {step.errors?.length ? <div className="mt-2 text-xs text-[var(--accent-red)]">{step.errors.join(" | ")}</div> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {notice ? (
          <div className="mt-4 rounded-xl border border-[rgba(245,166,35,.28)] bg-[rgba(245,166,35,.10)] p-3 text-sm font-bold text-[var(--accent-gold)]">
            {notice}
          </div>
        ) : null}

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">Resultados y productos</h2>
            <a className="btn" href="/dashboard/products">Ver todos</a>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {resultProducts.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
                <a href={`/dashboard/products/${product.id}`} className="block">
                  <div className="aspect-[16/9] bg-[#0b0b16]">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={product.title} className="h-full w-full object-cover" src={product.image_url} />
                    ) : (
                      <div className="grid h-full place-items-center text-sm font-bold text-[var(--text-muted)]">Sin imagen</div>
                    )}
                  </div>
                </a>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="line-clamp-2 font-bold">{product.title}</h3>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">{product.platform} · {product.category || "general"}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                      {product.auto_published ? "publicado" : "borrador"}
                    </span>
                  </div>
                  <div className="mt-3 font-mono text-sm text-[var(--accent-gold)]">{formatMoney(product.price, product.currency)}</div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <a className="btn" href={`/dashboard/products/${product.id}`}>Abrir</a>
                    <a className="btn" href={`/store/${product.slug}`} target="_blank" rel="noreferrer">Ver web</a>
                    <button className="btn btn-primary" disabled={Boolean(productAction)} onClick={() => runProductAction(product, "publish")} type="button">
                      {productAction === `publish:${product.id}` ? "Publicando..." : "Publicar"}
                    </button>
                    <button className="btn" disabled={Boolean(productAction)} onClick={() => runProductAction(product, "content")} type="button">
                      {productAction === `content:${product.id}` ? "Generando..." : "Contenido"}
                    </button>
                    <button className="btn" disabled={Boolean(productAction)} onClick={() => runProductAction(product, "provider-image")} type="button">
                      {productAction === `provider-image:${product.id}` ? "Cargando..." : "Foto proveedor"}
                    </button>
                    <button className="btn" disabled={Boolean(productAction)} onClick={() => runProductAction(product, "image")} type="button">
                      {productAction === `image:${product.id}` ? "Generando..." : "Imagen IA"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!resultProducts.length ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--text-secondary)]">
                Ejecuta &quot;Buscar productos&quot; o &quot;Ciclo completo&quot; para ver productos accionables aqui.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="surface p-5" data-help="Controles del agente. Son botones directos para ejecutar una parte concreta del sistema.">
        <h2 className="font-display text-xl font-bold">Controles</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Usa estos botones cuando quieras ordenar una tarea exacta sin escribirla manualmente.
        </p>
        <div className="mt-4 grid gap-3">
          {controls.map((control) => (
            <button
              className={`btn ${control.primary ? "btn-primary" : ""}`}
              data-help={control.help}
              disabled={Boolean(loadingAction)}
              key={control.action}
              onClick={() => submit(control.action)}
              type="button"
            >
              {loadingAction === control.action ? "Ejecutando..." : control.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
