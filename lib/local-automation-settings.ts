import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { AutomationId } from "@/types";

export interface LocalAutomationSetting {
  automation_id: AutomationId | string;
  enabled: boolean;
  schedule_cron: string;
  days_interval: number;
  times: string[];
  last_run_at?: string | null;
  updated_at: string;
}

const dataDir = path.join(process.cwd(), "data");
const settingsPath = path.join(dataDir, "local-automation-settings.json");
const logsPath = path.join(dataDir, "local-automation-logs.json");

export function buildCronFromTimes(daysInterval: number, times: string[]) {
  const safeInterval = Math.min(Math.max(Number(daysInterval) || 1, 1), 31);
  return times
    .filter((time) => /^\d{2}:\d{2}$/.test(time))
    .map((time) => {
      const [hour, minute] = time.split(":");
      return `${Number(minute)} ${Number(hour)} */${safeInterval} * *`;
    })
    .join(";");
}

export function parseTimesFromCron(scheduleCron: string) {
  return scheduleCron
    .split(";")
    .map((cron) => cron.trim().split(/\s+/))
    .filter((parts) => parts.length >= 5 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1]))
    .map(([minute, hour]) => `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
}

export async function getLocalAutomationSettings() {
  try {
    const file = await readFile(settingsPath, "utf8");
    return JSON.parse(file) as LocalAutomationSetting[];
  } catch {
    return [];
  }
}

export async function saveLocalAutomationSetting(setting: Omit<LocalAutomationSetting, "updated_at">) {
  const current = await getLocalAutomationSettings();
  const nextSetting: LocalAutomationSetting = { ...setting, updated_at: new Date().toISOString() };
  const next = [nextSetting, ...current.filter((item) => item.automation_id !== setting.automation_id)];
  await mkdir(dataDir, { recursive: true });
  await writeFile(settingsPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return nextSetting;
}

export async function appendLocalAutomationLog(entry: Record<string, unknown>) {
  let current: Array<Record<string, unknown>> = [];
  try {
    current = JSON.parse(await readFile(logsPath, "utf8")) as Array<Record<string, unknown>>;
  } catch {
    current = [];
  }
  const next = [{ ...entry, created_at: new Date().toISOString() }, ...current].slice(0, 500);
  await mkdir(dataDir, { recursive: true });
  await writeFile(logsPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

export function isAutomationDue(setting: LocalAutomationSetting, now = new Date()) {
  if (!setting.enabled) return false;
  const times = setting.times.length ? setting.times : parseTimesFromCron(setting.schedule_cron);
  const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (!times.includes(current)) return false;
  if (!setting.last_run_at) return true;

  const last = new Date(setting.last_run_at);
  return now.getTime() - last.getTime() > 55 * 60 * 1000;
}
