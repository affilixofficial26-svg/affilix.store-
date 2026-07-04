import { getAdminDb } from "@/lib/supabase";

export async function writeCronLog(jobName: string, status: "completed" | "failed", startedAt: number, metadata: Record<string, unknown> = {}, error?: unknown) {
  try {
    await getAdminDb().insert("cron_logs", {
      job_name: jobName,
      status,
      duration_ms: Date.now() - startedAt,
      metadata,
      error_detail: error instanceof Error ? error.message : error ? String(error) : null,
      finished_at: new Date().toISOString(),
    });
  } catch {
    // Logging must never break the job response.
  }
}
