import { getLocalAiConfig, hasSecret, localAiCatalog } from "@/lib/local-ai-config";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-[var(--text-secondary)]"}`}>
      {active ? "Guardada" : "Pendiente"}
    </span>
  );
}

function ToolGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function AiConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ ai_test?: string; message?: string }>;
}) {
  const config = await getLocalAiConfig();
  const params = await searchParams;
  const mainModel = config.ai_model || "gpt-4.1";

  return (
    <div className="max-w-5xl space-y-6">
      <form action="/api/accounts/connect" method="post" className="surface space-y-6 p-6" data-help="Configura la API de IA que usa AFFILIX para textos, agente, busqueda, automatizaciones y fotos.">
        <section className="space-y-4">
          <div>
            <h1 className="font-display text-3xl font-bold">API de IA</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Aqui conectas la IA principal del sistema. Esta API se usa para generar contenido, analizar productos, preparar SEO, completar fichas y ejecutar automatizaciones con IA.</p>
          </div>

          <div className="rounded-xl border border-[rgba(245,166,35,.22)] bg-[rgba(245,166,35,.06)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">Recomendado:</strong> OpenAI con modelo <span className="font-mono text-[var(--accent-gold)]">gpt-4.1</span> para texto/agente y <span className="font-mono text-[var(--accent-gold)]">gpt-image-1.5</span> para imagen. Si no guardas API key, las funciones de IA externas no podran ejecutarse.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold">Proveedor principal</span>
              <select className="input" data-help="OpenAI es la opcion recomendada para produccion. Ollama sirve para modelos locales." name="ai_provider" defaultValue={config.ai_provider || "openai"}>
                <option value="openai">OpenAI</option>
                <option value="ollama">Ollama local</option>
                <option value="anthropic">Anthropic</option>
                <option value="groq">Groq</option>
                <option value="mistral">Mistral</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold">Modelo principal</span>
              <select className="input" data-help="Modelo que usara el agente para escribir, analizar productos y automatizar tareas." name="ai_model" defaultValue={mainModel}>
                {localAiCatalog.llms.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold">URL de Ollama local</span>
              <input className="input" data-help="Solo se usa si eliges Ollama como proveedor." name="ollama_base_url" defaultValue={config.ollama_base_url || "http://localhost:11434"} placeholder="http://localhost:11434" />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold">API key principal de IA</span>
              <input className="input" data-help="Pega aqui tu API key del proveedor elegido. Se guarda localmente y no se muestra completa en pantalla." name="ai_api_key" type="password" placeholder={hasSecret(config.ai_api_key) ? "API key guardada" : "Pega tu API key aqui"} />
            </label>
          </div>
        </section>

        <section className="space-y-4 border-t border-[var(--border)] pt-6">
          <h2 className="font-display text-2xl font-bold">Herramientas locales opcionales</h2>
          <p className="text-sm text-[var(--text-secondary)]">Estas URLs solo se usan si tienes esas herramientas instaladas. No bloquean la IA principal.</p>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-bold">Open WebUI</span>
              <input className="input" name="open_webui_url" defaultValue={config.open_webui_url || "http://127.0.0.1:3000"} placeholder="http://127.0.0.1:3000" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">Perplexica / Vane</span>
              <input className="input" name="perplexica_url" defaultValue={config.perplexica_url || "http://127.0.0.1:3001"} placeholder="http://127.0.0.1:3001" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">n8n</span>
              <input className="input" name="n8n_url" defaultValue={config.n8n_url || "http://127.0.0.1:5678"} placeholder="http://127.0.0.1:5678" />
            </label>
            <label className="space-y-2 md:col-span-3">
              <span className="text-sm font-bold">API key Open WebUI opcional</span>
              <input className="input" name="open_webui_api_key" type="password" placeholder={hasSecret(config.open_webui_api_key) ? "API key guardada" : "Opcional"} />
            </label>
          </div>
        </section>

        <section className="space-y-4 border-t border-[var(--border)] pt-6">
          <h2 className="font-display text-2xl font-bold">API de imagen IA</h2>
          <p className="text-sm text-[var(--text-secondary)]">Se usa para generar imagenes de productos cuando falten fotos o quieras mejorar una ficha.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold">Proveedor de imagen</span>
              <select className="input" name="image_provider" defaultValue={config.image_provider || "openai"}>
                <option value="openai">OpenAI Images</option>
                <option value="custom">API local/custom</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">Modelo / motor</span>
              <input className="input" name="image_model" defaultValue={config.image_model || "gpt-image-1.5"} placeholder="gpt-image-1.5" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold">Endpoint imagen local/custom</span>
              <input className="input" name="image_base_url" defaultValue={config.image_base_url || "http://127.0.0.1:8188"} placeholder="http://127.0.0.1:8188" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold">API key de imagen</span>
              <input className="input" name="image_api_key" type="password" placeholder={hasSecret(config.image_api_key) ? "API key de imagen guardada" : "Si usas OpenAI, puedes usar la misma key o una key separada"} />
            </label>
          </div>
        </section>

        <button className="btn btn-primary" data-help="Guarda esta configuracion en el sistema local de AFFILIX." type="submit">Guardar API de IA</button>
      </form>

      {params.ai_test ? (
        <div className={`surface p-4 text-sm ${params.ai_test === "ok" ? "text-emerald-300" : "text-[var(--accent-gold)]"}`}>
          {params.ai_test === "ok" ? "Prueba de IA correcta. La API respondio y esta lista para automatizaciones." : `Prueba de IA con problema: ${params.message || "revisa API key, modelo o endpoint."}`}
        </div>
      ) : null}

      <form action="/api/ai/test-config" method="post" className="surface flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Probar API guardada</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Comprueba si la API/modelo guardados responden antes de activar automatizaciones con IA.</p>
        </div>
        <button className="btn btn-primary" type="submit">Probar conexion IA</button>
      </form>

      <section className="surface space-y-5 p-6" data-help="Resumen de las IAs y herramientas registradas en AFFILIX.">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Estado de IA conectada</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Resumen de lo que usara AFFILIX en contenido, agente y automatizaciones.</p>
          </div>
          <StatusBadge active={Boolean(config.updated_at)} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)] p-4">
            <p className="text-xs font-bold uppercase text-[var(--text-secondary)]">Texto / Agente / Automatizaciones</p>
            <p className="mt-2 font-mono text-sm">{config.ai_provider || "ollama"} / {mainModel}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{hasSecret(config.ai_api_key) ? "API key guardada" : "Falta API key para proveedor externo"}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-4">
            <p className="text-xs font-bold uppercase text-[var(--text-secondary)]">Imagen</p>
            <p className="mt-2 font-mono text-sm">{config.image_provider || "custom"} / {config.image_model || "comfyui"}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{config.image_base_url || "http://127.0.0.1:8188"}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {localAiCatalog.interfaces.map((tool) => {
            const value = config[tool.urlKey as keyof typeof config];
            return (
              <div key={tool.name} className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">{tool.name}</p>
                  <StatusBadge active={Boolean(value)} />
                </div>
                <p className="mt-2 break-all font-mono text-xs text-[var(--text-secondary)]">{String(value || "Sin URL")}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <ToolGroup title="Modelos LLM locales" items={localAiCatalog.llms} />
          <ToolGroup title="Imagen / video IA" items={[...localAiCatalog.image, ...localAiCatalog.video]} />
          <ToolGroup title="Voz / audio IA" items={[...localAiCatalog.voice, ...localAiCatalog.audio]} />
          <ToolGroup title="Herramientas de produccion" items={localAiCatalog.utilities} />
        </div>
      </section>
    </div>
  );
}
