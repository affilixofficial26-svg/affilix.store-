import { NextRequest, NextResponse } from "next/server";
import { getLocalPlatformAccounts } from "@/lib/local-platform-accounts";
import { getAdminDb } from "@/lib/supabase";
import { SETUP_AUTOMATIONS, SETUP_PLATFORMS } from "@/lib/setup-data";
import type { AutomationSetting, AutomationId, Platform, PlatformAccount, PlatformSetupProgress } from "@/types";

const DEFAULT_SETUP_KEY = "default";

function setupKey(userId: string | null) {
  return userId || DEFAULT_SETUP_KEY;
}

function cleanPlatform(value: unknown): Platform | null {
  const platform = String(value || "");
  return SETUP_PLATFORMS.some((item) => item.id === platform) ? (platform as Platform) : null;
}

function cleanAutomation(value: unknown): AutomationId | null {
  const automation = String(value || "");
  return SETUP_AUTOMATIONS.some((item) => item.id === automation) ? (automation as AutomationId) : null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    const key = setupKey(userId);
    const db = getAdminDb();
    const [progressRows, automationRows, accountRows] = await Promise.all([
      db.select<PlatformSetupProgress>("platform_setup_progress", { setup_key: `eq.${key}` }),
      db.select<AutomationSetting>("automation_settings", { setup_key: `eq.${key}` }),
      db.select<PlatformAccount>("platform_accounts", userId ? { user_id: `eq.${userId}` } : { user_id: "is.null" }),
    ]);

    const localAccounts = await getLocalPlatformAccounts();
    const connectedPlatforms = new Set([
      ...accountRows.filter((row) => row.connected).map((row) => row.platform),
      ...localAccounts.filter((row) => row.connected).map((row) => row.platform),
    ]);
    const progress = SETUP_PLATFORMS.map((platform) => {
      const row = progressRows.find((item) => item.platform === platform.id);
      return {
        platform: platform.id,
        completed: Boolean(row?.completed || connectedPlatforms.has(platform.id)),
        completed_at: row?.completed_at || null,
        connected: connectedPlatforms.has(platform.id),
      };
    });

    const automations = SETUP_AUTOMATIONS.map((automation) => {
      const row = automationRows.find((item) => item.automation_id === automation.id);
      return {
        automation_id: automation.id,
        enabled: row?.enabled ?? true,
        schedule_cron: row?.schedule_cron || automation.schedule,
      };
    });

    return NextResponse.json({ ok: true, setup_key: key, progress, automations });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Falta variable de entorno")) {
      const localAccounts = await getLocalPlatformAccounts();
      const connectedPlatforms = new Set(localAccounts.filter((row) => row.connected).map((row) => row.platform));
      return NextResponse.json({ ok: true, setup_key: DEFAULT_SETUP_KEY, progress: defaultProgress(connectedPlatforms), automations: defaultAutomations(), warning: "Supabase no esta configurado. El setup se muestra en modo lectura hasta completar .env.local." });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo cargar el setup." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.user_id ? String(body.user_id) : null;
    const key = setupKey(userId);
    const db = getAdminDb();

    if (body.type === "platform") {
      const platform = cleanPlatform(body.platform);
      if (!platform) return NextResponse.json({ ok: false, error: "Plataforma invalida." }, { status: 400 });
      const completed = Boolean(body.completed);
      await db.upsert<PlatformSetupProgress>(
        "platform_setup_progress",
        {
          setup_key: key,
          user_id: userId,
          platform,
          completed,
          notes: body.notes ? String(body.notes) : null,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        "setup_key,platform",
      );
      return NextResponse.json({ ok: true, platform, completed });
    }

    if (body.type === "automation") {
      const automation = cleanAutomation(body.automation_id);
      if (!automation) return NextResponse.json({ ok: false, error: "Automatizacion invalida." }, { status: 400 });
      const defaults = SETUP_AUTOMATIONS.find((item) => item.id === automation);
      await db.upsert<AutomationSetting>(
        "automation_settings",
        {
          setup_key: key,
          user_id: userId,
          automation_id: automation,
          enabled: Boolean(body.enabled),
          schedule_cron: body.schedule_cron ? String(body.schedule_cron) : defaults?.schedule || "",
          updated_at: new Date().toISOString(),
        },
        "setup_key,automation_id",
      );
      return NextResponse.json({ ok: true, automation_id: automation, enabled: Boolean(body.enabled) });
    }

    return NextResponse.json({ ok: false, error: "Tipo de actualizacion no soportado." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo guardar el setup." }, { status: 500 });
  }
}

function defaultProgress(connectedPlatforms = new Set<Platform>()) {
  return SETUP_PLATFORMS.map((platform) => ({
    platform: platform.id,
    completed: connectedPlatforms.has(platform.id),
    completed_at: null,
    connected: connectedPlatforms.has(platform.id),
  }));
}

function defaultAutomations() {
  return SETUP_AUTOMATIONS.map((automation) => ({
    automation_id: automation.id,
    enabled: true,
    schedule_cron: automation.schedule,
  }));
}
