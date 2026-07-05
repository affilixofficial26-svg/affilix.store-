import { getAdminDb } from "@/lib/supabase";
import { fetchWithTimeout, requiredEnv, retry } from "@/lib/utils";

export type MuapiCategory = "text" | "image" | "video" | "audio" | "enhance" | "edit" | "avatar" | "3d" | "upload";
export type MuapiOrigin = "ai_service" | "agent" | "media_studio" | "marketing" | "affiliate_creative" | "manual";

export type MuapiJob = {
  id: string;
  request_id: string | null;
  endpoint: string;
  model: string;
  category: MuapiCategory;
  input: Record<string, unknown>;
  output_urls: string[] | null;
  stored_asset_ids: string[] | null;
  status: "queued" | "processing" | "completed" | "failed" | "timeout" | "cancelled";
  cost_usd: number | null;
  origin: MuapiOrigin;
  error_detail: string | null;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
};

export type SubmitParams = {
  endpoint: string;
  input: Record<string, unknown>;
  category: MuapiCategory;
  origin: MuapiOrigin;
  refs?: {
    service_run_id?: string;
    agent_run_id?: string;
    order_id?: string;
    campaign_id?: string;
    user_id?: string;
  };
  estimated_cost_usd?: number;
};

const DEFAULT_BASE = "https://api.muapi.ai/api/v1";

function muapiBase() {
  return (process.env.MUAPI_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
}

function muapiHeaders(json = true) {
  const headers: Record<string, string> = { "x-api-key": requiredEnv("MUAPI_API_KEY") };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

async function muapiFetch<T>(path: string, init: RequestInit = {}, timeoutMs = 60_000): Promise<T> {
  const response = await retry(async () => {
    const res = await fetchWithTimeout(`${muapiBase()}${path.startsWith("/") ? path : `/${path}`}`, init, timeoutMs);
    if (res.status >= 500) throw new Error(`MuAPI HTTP ${res.status}`);
    return res;
  }, 3, 2_000);

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `MuAPI HTTP ${response.status}`);
  }
  return data as T;
}

function estimatedCost(params: SubmitParams) {
  return Number(params.estimated_cost_usd ?? params.input.estimated_cost_usd ?? 0);
}

async function getMonthlySpendUsd() {
  try {
    const rows = await getAdminDb().select<{ spend_usd: number | string | null }>("v_muapi_monthly_spend", {
      select: "spend_usd",
      limit: "1",
    });
    return Number(rows[0]?.spend_usd || 0);
  } catch {
    return 0;
  }
}

async function assertBudget(params: SubmitParams) {
  const cost = estimatedCost(params);
  const maxJob = Number(process.env.MUAPI_MAX_COST_PER_JOB_USD || 3);
  const monthlyBudget = Number(process.env.MUAPI_MONTHLY_BUDGET_USD || 100);
  if (cost > maxJob) {
    const error = new Error(`El coste estimado (${cost}) supera el limite por job (${maxJob}).`);
    (error as Error & { status?: number }).status = 402;
    throw error;
  }
  const spend = await getMonthlySpendUsd();
  if (spend + cost > monthlyBudget) {
    const error = new Error(`El presupuesto mensual MuAPI quedaria superado (${spend + cost}/${monthlyBudget}).`);
    (error as Error & { status?: number }).status = 402;
    throw error;
  }
}

export async function submitJob(params: SubmitParams) {
  await assertBudget(params);
  const db = getAdminDb();
  const model = String(params.input.model || params.endpoint);
  const [job] = await db.insert<MuapiJob>("muapi_jobs", {
    endpoint: params.endpoint,
    model,
    category: params.category,
    input: params.input,
    status: "queued",
    origin: params.origin,
    cost_usd: estimatedCost(params),
    ...params.refs,
  });
  if (!job?.id) throw new Error("No se pudo crear muapi_jobs.");

  try {
    const response = await muapiFetch<{ request_id?: string; id?: string }>(`/${params.endpoint}`, {
      method: "POST",
      headers: muapiHeaders(),
      body: JSON.stringify(params.input),
      cache: "no-store",
    });
    const requestId = response.request_id || response.id;
    if (!requestId) throw new Error("MuAPI no devolvio request_id.");
    await db.update<MuapiJob>("muapi_jobs", { id: job.id }, {
      request_id: requestId,
      status: "processing",
      started_at: new Date().toISOString(),
    });
    return { jobId: job.id, requestId };
  } catch (error) {
    await db.update("muapi_jobs", { id: job.id }, {
      status: "failed",
      error_detail: error instanceof Error ? error.message : "Error desconocido",
      finished_at: new Date().toISOString(),
    });
    throw error;
  }
}

export async function submitTextJob(params: {
  prompt: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  origin: MuapiOrigin;
  refs?: SubmitParams["refs"];
}) {
  const endpoint = process.env.MUAPI_TEXT_ENDPOINT || "text-generation";
  const model = params.model || process.env.MUAPI_TEXT_MODEL || "claude-sonnet-4-6";
  return submitJob({
    endpoint,
    category: "text",
    origin: params.origin,
    refs: params.refs,
    estimated_cost_usd: 0.02,
    input: {
      model,
      prompt: params.prompt,
      max_tokens: params.max_tokens || 1600,
      temperature: params.temperature ?? 0.4,
    },
  });
}

export async function getBalance() {
  const response = await muapiFetch<{ balance_usd?: number; balance?: number }>("/account/balance", {
    headers: muapiHeaders(false),
    cache: "no-store",
  }, 20_000);
  return { balance_usd: Number(response.balance_usd ?? response.balance ?? 0) };
}

export async function getJob(jobId: string) {
  const rows = await getAdminDb().select<MuapiJob>("muapi_jobs", { select: "*", id: `eq.${jobId}`, limit: "1" });
  return rows[0] || null;
}

async function uploadBufferToStorage(path: string, data: ArrayBuffer, contentType: string) {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = process.env.MUAPI_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET_MEDIA || "media-generated";
  const response = await fetchWithTimeout(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: Buffer.from(data),
  }, 60_000);
  if (!response.ok) throw new Error(`Storage HTTP ${response.status}: ${await response.text()}`);
  return { bucket, storagePath: path };
}

async function storeOutput(job: MuapiJob, url: string, index: number) {
  const response = await fetchWithTimeout(url, { cache: "no-store" }, 60_000);
  if (!response.ok) throw new Error(`No se pudo descargar output MuAPI: HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const ext = contentType.includes("png") ? "png" : contentType.includes("jpeg") ? "jpg" : contentType.includes("mp4") ? "mp4" : contentType.includes("mpeg") ? "mp3" : "bin";
  const path = `muapi/${job.id}/${index + 1}.${ext}`;
  const data = await response.arrayBuffer();
  const stored = await uploadBufferToStorage(path, data, contentType);
  try {
    const [asset] = await getAdminDb().insert<{ id: string }>("digital_assets", {
      catalog_item_id: null,
      storage_path: stored.storagePath,
      file_name: `muapi-${job.id}-${index + 1}.${ext}`,
      content_type: contentType,
      file_size: data.byteLength,
      bucket: stored.bucket,
      filename: `muapi-${job.id}-${index + 1}.${ext}`,
      mime_type: contentType,
      size_bytes: data.byteLength,
      metadata: { muapi_job_id: job.id, source_url: url },
    });
    return asset?.id;
  } catch {
    return undefined;
  }
}

export async function pollJob(jobId: string) {
  const job = await getJob(jobId);
  if (!job) throw new Error("Job MuAPI no encontrado.");
  if (!job.request_id) return { status: job.status, error: "Job sin request_id." };

  const result = await muapiFetch<{
    status?: string;
    outputs?: string[];
    output?: string | string[];
    error?: string;
    cost_usd?: number;
  }>(`/predictions/${job.request_id}/result`, {
    headers: muapiHeaders(false),
    cache: "no-store",
  }, 30_000);

  const rawStatus = String(result.status || "processing").toLowerCase();
  const completed = rawStatus === "completed" || rawStatus === "succeeded" || rawStatus === "success";
  const failed = rawStatus === "failed" || rawStatus === "error";
  const outputs = Array.isArray(result.outputs) ? result.outputs : Array.isArray(result.output) ? result.output : result.output ? [result.output] : [];

  if (completed) {
    const storedIds = (await Promise.all(outputs.map((url, index) => storeOutput(job, url, index)))).filter(Boolean) as string[];
    await getAdminDb().update("muapi_jobs", { id: job.id }, {
      status: "completed",
      output_urls: outputs,
      stored_asset_ids: storedIds,
      cost_usd: Number(result.cost_usd ?? job.cost_usd ?? 0),
      finished_at: new Date().toISOString(),
    });
    await recordFinanceFee(job, Number(result.cost_usd ?? job.cost_usd ?? 0));
    return { status: "completed", outputs, stored_asset_ids: storedIds };
  }

  if (failed) {
    await getAdminDb().update("muapi_jobs", { id: job.id }, {
      status: "failed",
      error_detail: result.error || "MuAPI marco el job como fallido.",
      finished_at: new Date().toISOString(),
    });
    return { status: "failed", error: result.error || "MuAPI marco el job como fallido." };
  }

  await getAdminDb().update("muapi_jobs", { id: job.id }, { status: "processing" });
  return { status: "processing" };
}

async function recordFinanceFee(job: MuapiJob, costUsd: number) {
  if (!costUsd) return;
  try {
    await getAdminDb().insert("finance_events", {
      type: "fee",
      amount_cents: Math.round(costUsd * 100),
      currency: "USD",
      provider: "internal",
      provider_event_id: `muapi:${job.id}`,
      metadata: { muapi_job_id: job.id, model: job.model, category: job.category },
    });
  } catch {
    // El coste queda en muapi_jobs aunque finance_events no exista todavia.
  }
}

export async function pollPending(limit = 10) {
  const jobs = await getAdminDb().select<MuapiJob>("muapi_jobs", {
    select: "*",
    status: "in.(queued,processing)",
    order: "created_at.asc",
    limit: String(limit),
  });
  const results = [];
  for (const job of jobs) {
    if (job.request_id) results.push({ id: job.id, ...(await pollJob(job.id)) });
  }
  return results;
}

export async function syncModelCatalog() {
  const models = [
    ["flux-dev-image", "image", "Flux Dev", true, false, 0],
    ["claude-sonnet-4-6", "text", "Claude Sonnet 4.6", false, false, 0],
    ["gpt-4o-muapi", "text", "GPT-4o via MuAPI", false, false, 0],
    ["deepseek-chat", "text", "DeepSeek Chat", false, false, 0],
    ["llama-3.1-70b", "text", "Llama 3.1 70B", false, false, 0],
    ["flux-schnell-image", "image", "Flux Schnell", true, false, 0],
    ["kling-pro-video", "video", "Kling Pro", true, false, 8],
    ["kling-master-video", "video", "Kling Master", true, false, 8],
    ["suno-music", "audio", "Suno Music", false, false, 120],
    ["mmaudio", "audio", "MMAudio", false, true, 60],
    ["bg-remove", "enhance", "Background Removal", true, false, 0],
    ["upscale", "enhance", "Upscale", true, false, 0],
    ["latentsync", "avatar", "LatentSync", true, true, 30],
    ["tripo3d", "3d", "Tripo3D", true, false, 0],
  ].map(([slug, category, display_name, supports_image_input, supports_audio_input, max_duration_seconds]) => ({
    slug,
    category,
    display_name,
    description: `Modelo MuAPI ${display_name}`,
    input_schema: {},
    supports_image_input,
    supports_audio_input,
    max_duration_seconds,
    active: true,
    synced_at: new Date().toISOString(),
  }));
  await getAdminDb().upsert("muapi_models", models, "slug");
  return { synced: models.length };
}
