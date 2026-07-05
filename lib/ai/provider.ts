export type AITextProvider = "muapi" | "openai" | "anthropic" | "none";
export type AiCapability = "text" | "image" | "video" | "audio";

export function getAITextProvider(): AITextProvider {
  const provider = (process.env.AI_TEXT_PROVIDER || "muapi").toLowerCase();
  if (provider === "openai" || provider === "anthropic" || provider === "muapi") return provider;
  return "none";
}

export function isAITextAvailable() {
  const provider = getAITextProvider();
  if (provider === "muapi") return Boolean(process.env.MUAPI_API_KEY);
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  if (provider === "anthropic") return Boolean(process.env.ANTHROPIC_API_KEY);
  return false;
}

export function isAIMediaAvailable() {
  return Boolean(process.env.MUAPI_API_KEY);
}

export function isAiAvailable(cap: AiCapability): boolean {
  const provider = getAITextProvider();
  const hasMuapi = Boolean(process.env.MUAPI_API_KEY);

  if (cap === "text") {
    if (provider === "muapi") return hasMuapi;
    if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
    if (provider === "anthropic") return Boolean(process.env.ANTHROPIC_API_KEY);
    return false;
  }

  return hasMuapi;
}

export function providerLabel(cap: AiCapability): string {
  if (!isAiAvailable(cap)) return "No configurado";
  const provider = getAITextProvider();
  if (cap === "text" && provider !== "muapi") return provider === "openai" ? "OpenAI" : "Anthropic";
  return "MuAPI";
}

export function isCronSecretConfigured() {
  return Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 32);
}
