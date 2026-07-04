import { NextRequest, NextResponse } from "next/server";
import { appendLocalAutomationLog, getLocalAutomationSettings, isAutomationDue, saveLocalAutomationSetting } from "@/lib/local-automation-settings";

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const settings = await getLocalAutomationSettings();
  const due = settings.filter((setting) => isAutomationDue(setting, now));

  for (const setting of due) {
    await appendLocalAutomationLog({
      action: `automation:${setting.automation_id}:scheduled_run`,
      status: "success",
      details: {
        automation_id: setting.automation_id,
        schedule_cron: setting.schedule_cron,
        days_interval: setting.days_interval,
        times: setting.times,
      },
    });
    await saveLocalAutomationSetting({ ...setting, last_run_at: now.toISOString() });
  }

  return NextResponse.json({
    ok: true,
    checked_at: now.toISOString(),
    executed: due.map((setting) => setting.automation_id),
  });
}
