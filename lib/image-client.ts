import { fetchWithTimeout, retry } from "@/lib/utils";
import type { AffiliateProduct, ImageProvider, UserProfile } from "@/types";

type ImageConfig = {
  provider: ImageProvider;
  apiKey?: string | null;
  model?: string | null;
  baseUrl?: string | null;
};

type ImageResult = {
  imageUrl: string;
  prompt: string;
  provider: ImageProvider;
  model: string;
};

type OpenAiImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
};

type CustomImageResponse = {
  image_url?: string;
  imageUrl?: string;
  url?: string;
  b64_json?: string;
};

const defaultImageModels: Record<ImageProvider, string> = {
  openai: "gpt-image-1.5",
  custom: "custom-product-image",
};

export function resolveImageConfig(profile: UserProfile): ImageConfig | null {
  if (profile.image_provider) {
    return {
      provider: profile.image_provider,
      apiKey: profile.image_api_key || profile.ai_api_key,
      model: profile.image_model || defaultImageModels[profile.image_provider],
      baseUrl: profile.image_base_url,
    };
  }

  if (profile.ai_provider === "openai") {
    return {
      provider: "openai",
      apiKey: profile.ai_api_key,
      model: "gpt-image-1.5",
    };
  }

  return null;
}

export function productImagePrompt(product: AffiliateProduct) {
  return [
    "Fotografía comercial fotorrealista de producto para una tienda online.",
    `Producto: ${product.ai_title || product.title}.`,
    product.category ? `Categoría: ${product.category}.` : "",
    product.description ? `Descripción base: ${product.description.slice(0, 260)}.` : "",
    "Mostrar el producto principal con iluminación de estudio, fondo limpio, perspectiva natural y alta nitidez.",
    "No incluir texto promocional, marcas inventadas, logos falsos, etiquetas ilegibles ni personas.",
    "La imagen debe parecer una foto real del producto descrito, lista para e-commerce.",
  ].filter(Boolean).join(" ");
}

export async function generateProductImage(config: ImageConfig, product: AffiliateProduct): Promise<ImageResult> {
  const prompt = productImagePrompt(product);
  const model = config.model || defaultImageModels[config.provider];

  if (config.provider === "openai") {
    if (!config.apiKey) throw new Error("Falta API key de imagen OpenAI");
    const res = await retry(() =>
      fetchWithTimeout("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model,
          prompt,
          size: "1024x1024",
          quality: "medium",
          n: 1,
        }),
      }, 90000),
    );
    if (!res.ok) throw new Error(`OpenAI Images error: ${await res.text()}`);
    const data = (await res.json()) as OpenAiImageResponse;
    const first = data.data?.[0];
    if (first?.url) return { imageUrl: first.url, prompt, provider: "openai", model };
    if (first?.b64_json) return { imageUrl: `data:image/png;base64,${first.b64_json}`, prompt, provider: "openai", model };
    throw new Error("OpenAI Images no devolvió imagen");
  }

  if (!config.baseUrl) throw new Error("Falta URL base de la API custom de imágenes");
  const res = await retry(() =>
    fetchWithTimeout(config.baseUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        prompt,
        product: {
          id: product.id,
          title: product.ai_title || product.title,
          category: product.category,
          platform: product.platform,
        },
      }),
    }, 90000),
  );
  if (!res.ok) throw new Error(`API custom de imágenes error: ${await res.text()}`);
  const data = (await res.json()) as CustomImageResponse;
  const imageUrl = data.image_url || data.imageUrl || data.url || (data.b64_json ? `data:image/png;base64,${data.b64_json}` : "");
  if (!imageUrl) throw new Error("La API custom no devolvió image_url, imageUrl, url o b64_json");
  return { imageUrl, prompt, provider: "custom", model };
}
