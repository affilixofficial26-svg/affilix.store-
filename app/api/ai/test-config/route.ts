import { NextRequest, NextResponse } from "next/server";
import { getLocalAiConfig } from "@/lib/local-ai-config";
import { generateText } from "@/lib/openai-client";
import type { AiProvider } from "@/types";

export async function POST(req: NextRequest) {
  const config = await getLocalAiConfig();
  const url = new URL("/dashboard/settings/ai-config", req.url);

  try {
    const message = await generateText(
      {
        provider: (config.ai_provider || "openai") as AiProvider,
        apiKey: config.ai_api_key,
        model: config.ai_model,
        ollamaBaseUrl: config.ollama_base_url,
      },
      "Responde exactamente: OK AFFILIX",
    );

    url.searchParams.set("ai_test", message.trim().includes("OK") ? "ok" : "warning");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    url.searchParams.set("ai_test", "error");
    url.searchParams.set("message", error instanceof Error ? error.message.slice(0, 160) : "Error desconocido");
    return NextResponse.redirect(url, 303);
  }
}
