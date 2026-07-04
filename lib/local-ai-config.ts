import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { decryptSecret, encryptSecret } from "@/lib/security";

export interface LocalAiConfig {
  store_name?: string;
  store_slug?: string;
  currency?: string;
  ai_provider?: string;
  ai_model?: string;
  ai_api_key?: string;
  ollama_base_url?: string;
  open_webui_url?: string;
  open_webui_api_key?: string;
  perplexica_url?: string;
  n8n_url?: string;
  image_provider?: string;
  image_model?: string;
  image_api_key?: string;
  image_base_url?: string;
  updated_at?: string;
}

const configDir = path.join(process.cwd(), "data");
const configPath = path.join(configDir, "local-ai-config.json");

export const defaultLocalAiConfig: LocalAiConfig = {
  currency: "USD",
  ai_provider: "openai",
  ai_model: "gpt-4.1",
  ollama_base_url: "http://localhost:11434",
  open_webui_url: "http://127.0.0.1:3000",
  perplexica_url: "http://127.0.0.1:3001",
  n8n_url: "http://127.0.0.1:5678",
  image_provider: "openai",
  image_model: "gpt-image-1.5",
  image_base_url: "http://127.0.0.1:8188",
};

export const localAiCatalog = {
  llms: ["gpt-4.1", "o3", "gpt-4o", "gpt-4.1-mini", "qwen2.5:7b", "gemma4:latest", "llama3:latest"],
  interfaces: [
    { name: "Open WebUI", urlKey: "open_webui_url" },
    { name: "Perplexica / Vane", urlKey: "perplexica_url" },
    { name: "n8n", urlKey: "n8n_url" },
  ],
  image: ["gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini", "ComfyUI", "stable-diffusion-webui"],
  voice: ["tts-webui", "Bark", "Kokoro", "GPT-SoVITS", "RVC-WebUI"],
  video: ["Wav2Lip", "SadTalker", "video-retalking", "LatentSync", "LivePortrait", "MuseTalk"],
  audio: ["ACE-Step", "AudioCraft", "riffusion-hobby", "Demucs"],
  utilities: ["WhisperTools", "Real-ESRGAN", "CodeFormer", "FootageHunter", "VFXMaestro", "PocketBase", "Portainer"],
};

function cleanValue(value: FormDataEntryValue | unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export async function getLocalAiConfig() {
  try {
    const file = await readFile(configPath, "utf8");
    const parsed = { ...defaultLocalAiConfig, ...(JSON.parse(file) as LocalAiConfig) };
    return {
      ...parsed,
      ai_api_key: decryptSecret(parsed.ai_api_key),
      open_webui_api_key: decryptSecret(parsed.open_webui_api_key),
      image_api_key: decryptSecret(parsed.image_api_key),
    };
  } catch {
    return defaultLocalAiConfig;
  }
}

export async function saveLocalAiConfig(input: Record<string, FormDataEntryValue | unknown>) {
  const current = await getLocalAiConfig();
  const next: LocalAiConfig = {
    ...current,
    store_name: cleanValue(input.store_name) ?? current.store_name,
    store_slug: cleanValue(input.store_slug) ?? current.store_slug,
    currency: cleanValue(input.currency) ?? current.currency,
    ai_provider: cleanValue(input.ai_provider) ?? current.ai_provider,
    ai_model: cleanValue(input.ai_model) ?? current.ai_model,
    ai_api_key: cleanValue(input.ai_api_key) ? encryptSecret(cleanValue(input.ai_api_key)) : current.ai_api_key ? encryptSecret(current.ai_api_key) : undefined,
    ollama_base_url: cleanValue(input.ollama_base_url) ?? current.ollama_base_url,
    open_webui_url: cleanValue(input.open_webui_url) ?? current.open_webui_url,
    open_webui_api_key: cleanValue(input.open_webui_api_key) ? encryptSecret(cleanValue(input.open_webui_api_key)) : current.open_webui_api_key ? encryptSecret(current.open_webui_api_key) : undefined,
    perplexica_url: cleanValue(input.perplexica_url) ?? current.perplexica_url,
    n8n_url: cleanValue(input.n8n_url) ?? current.n8n_url,
    image_provider: cleanValue(input.image_provider) ?? current.image_provider,
    image_model: cleanValue(input.image_model) ?? current.image_model,
    image_api_key: cleanValue(input.image_api_key) ? encryptSecret(cleanValue(input.image_api_key)) : current.image_api_key ? encryptSecret(current.image_api_key) : undefined,
    image_base_url: cleanValue(input.image_base_url) ?? current.image_base_url,
    updated_at: new Date().toISOString(),
  };

  await mkdir(configDir, { recursive: true });
  await writeFile(configPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export function hasSecret(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}
