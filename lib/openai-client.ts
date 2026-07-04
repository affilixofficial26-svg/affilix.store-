import { fetchWithTimeout, retry } from "@/lib/utils";
import type { AiProvider } from "@/types";

interface AiConfig {
  provider: AiProvider;
  apiKey?: string | null;
  model?: string | null;
  ollamaBaseUrl?: string | null;
}

const defaultModels: Record<AiProvider, string> = {
  openai: "gpt-4.1",
  anthropic: "claude-3-5-sonnet-latest",
  groq: "llama-3.3-70b-versatile",
  mistral: "mistral-large-latest",
  ollama: "qwen2.5:7b",
};

export async function generateText(config: AiConfig, prompt: string) {
  if (!prompt.trim()) throw new Error("prompt es obligatorio");
  const model = config.model || defaultModels[config.provider];
  if (config.provider === "ollama") {
    const base = config.ollamaBaseUrl || "http://localhost:11434";
    const res = await retry(() =>
      fetchWithTimeout(`${base.replace(/\/$/, "")}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false }),
      }, 60000),
    );
    if (!res.ok) throw new Error(`Ollama error: ${await res.text()}`);
    const data = await res.json();
    return String(data.response || "");
  }
  if (!config.apiKey) throw new Error(`Falta API key para ${config.provider}`);
  const endpoints: Record<Exclude<AiProvider, "ollama">, string> = {
    openai: "https://api.openai.com/v1/responses",
    groq: "https://api.groq.com/openai/v1/chat/completions",
    mistral: "https://api.mistral.ai/v1/chat/completions",
    anthropic: "https://api.anthropic.com/v1/messages",
  };
  if (config.provider === "anthropic") {
    const res = await retry(() =>
      fetchWithTimeout(endpoints.anthropic, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": config.apiKey!, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: 1200, messages: [{ role: "user", content: prompt }] }),
      }, 60000),
    );
    if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`);
    const data = await res.json();
    return String(data.content?.[0]?.text || "");
  }
  if (config.provider === "openai") {
    const res = await retry(() =>
      fetchWithTimeout(endpoints.openai, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model,
          input: prompt,
          temperature: 0.6,
          text: { format: { type: "text" } },
        }),
      }, 60000),
    );
    if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
    const data = await res.json();
    if (typeof data.output_text === "string") return data.output_text;
    const output: Array<{ content?: Array<{ text?: string }> }> = Array.isArray(data.output) ? data.output : [];
    return output
      .flatMap((item) => Array.isArray(item.content) ? item.content : [])
      .map((item) => item.text || "")
      .join("")
      .trim();
  }
  const provider = config.provider as Exclude<AiProvider, "ollama">;
  const res = await retry(() =>
    fetchWithTimeout(endpoints[provider], {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.6 }),
    }, 60000),
  );
  if (!res.ok) throw new Error(`${config.provider} error: ${await res.text()}`);
  const data = await res.json();
  return String(data.choices?.[0]?.message?.content || "");
}

export function productContentPrompt(product: { title: string; price?: number | null; category?: string | null; rating?: number | null; review_count?: number | null }) {
  return `Eres un copywriter experto en e-commerce afiliado. Genera JSON válido en español para este producto sin inventar datos falsos.
Producto: ${product.title}
Precio: ${product.price ?? "no disponible"}
Categoría: ${product.category ?? "general"}
Rating: ${product.rating ?? "no disponible"}
Reseñas reales: ${product.review_count ?? "no disponible"}
Devuelve exactamente estas claves: ai_title, ai_description, ai_review, seo_title, seo_description, pros, cons, seo_keywords.`;
}
