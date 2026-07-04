import { NextRequest, NextResponse } from "next/server";
import { appendLocalAutomationLog, buildCronFromTimes, saveLocalAutomationSetting } from "@/lib/local-automation-settings";
import { getAdminDb } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const id = String(body.automation_id || body.name || "manual_campaign");
  const intent = String(body.intent || "run_now");
  const enabled = body.enabled === "on" || body.enabled === true || body.enabled === "true";
  const rawTimes = [body.time_1, body.time_2].map((time) => String(time || "").trim()).filter(Boolean);
  const daysInterval = Math.min(Math.max(Number(body.days_interval || 1), 1), 31);
  const scheduleCron = rawTimes.length ? buildCronFromTimes(daysInterval, rawTimes) : String(body.schedule_cron || "0 9 * * *");
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (hasSupabase) {
    const db = getAdminDb();
    await db.upsert(
      "automation_settings",
      {
        setup_key: "default",
        user_id: body.user_id || null,
        automation_id: id,
        enabled,
        schedule_cron: scheduleCron,
        updated_at: new Date().toISOString(),
      },
      "setup_key,automation_id",
    );

    await db.insert("agent_logs", {
      user_id: body.user_id || null,
      action: intent === "run_now" ? `automation:${id}:run_now` : `automation:${id}:save_state`,
      details: { ...body, schedule_cron: scheduleCron, days_interval: daysInterval, times: rawTimes },
      status: "success",
    });
  } else {
    await saveLocalAutomationSetting({
      automation_id: id,
      enabled,
      schedule_cron: scheduleCron,
      days_interval: daysInterval,
      times: rawTimes,
      last_run_at: intent === "run_now" ? new Date().toISOString() : null,
    });
    await appendLocalAutomationLog({
      action: intent === "run_now" ? `automation:${id}:run_now` : `automation:${id}:save_state`,
      status: "success",
      details: { automation_id: id, enabled, schedule_cron: scheduleCron, days_interval: daysInterval, times: rawTimes },
    });
  }

  if (contentType.includes("application/json")) return NextResponse.json({ ok: true, automation_id: id, enabled, intent, schedule_cron: scheduleCron });
  return NextResponse.redirect(new URL("/dashboard/automation", req.url), 303);
}
