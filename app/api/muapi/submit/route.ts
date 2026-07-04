import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server-auth";
import { submitJob } from "@/lib/muapi/client";

export const dynamic = "force-dynamic";

const submitSchema = z.object({
  endpoint: z.string().trim().min(2).max(120),
  category: z.enum(["image", "video", "audio", "enhance", "edit", "avatar", "3d", "upload"]),
  origin: z.enum(["ai_service", "agent", "media_studio", "marketing", "affiliate_creative", "manual"]).default("media_studio"),
  input: z.record(z.string(), z.unknown()).default({}),
  refs: z.object({
    service_run_id: z.string().uuid().optional(),
    agent_run_id: z.string().uuid().optional(),
    order_id: z.string().uuid().optional(),
    campaign_id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
  }).optional(),
  estimated_cost_usd: z.coerce.number().min(0).max(100).optional(),
});

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const isForm = req.headers.get("content-type")?.includes("form");
  const payload = isForm ? await formPayload(req) : await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(payload);
  if (!parsed.success) {
    if (isForm) return NextResponse.redirect(new URL("/dashboard/media-studio?error=invalid", req.url), 303);
    return NextResponse.json({ error: "Payload MuAPI invalido.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const job = await submitJob(parsed.data);
    if (isForm) return NextResponse.redirect(new URL(`/dashboard/media-studio/jobs?job=${job.jobId}`, req.url), 303);
    return NextResponse.json(job);
  } catch (error) {
    const status = (error as Error & { status?: number }).status || 502;
    const message = error instanceof Error ? error.message : "No se pudo crear job MuAPI.";
    if (isForm) return NextResponse.redirect(new URL(`/dashboard/media-studio?error=${encodeURIComponent(message)}`, req.url), 303);
    return NextResponse.json({ error: message }, { status });
  }
}

async function formPayload(req: NextRequest) {
  const form = await req.formData();
  const category = String(form.get("category") || "image");
  const endpoint = String(form.get("endpoint") || "");
  const prompt = String(form.get("prompt") || "");
  const aspectRatio = String(form.get("aspect_ratio") || "");
  const duration = Number(form.get("duration") || 0);
  const estimatedCost = Number(form.get("estimated_cost_usd") || 0);
  return {
    endpoint,
    category,
    origin: String(form.get("origin") || "media_studio"),
    estimated_cost_usd: estimatedCost,
    input: {
      prompt,
      model: endpoint,
      aspect_ratio: aspectRatio,
      duration,
    },
  };
}
