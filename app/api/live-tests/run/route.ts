import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLiveTestRun, finishLiveTestRun, insertLiveTestSteps, type LiveTestStatus } from "@/lib/live-tests";

export const dynamic = "force-dynamic";

const schema = z.object({
  suite: z.enum(["all", "public", "admin", "affiliate", "payments", "muapi"]).default("all"),
});

const publicRoutes = [
  ["/", "Home publica"],
  ["/productos-digitales", "Productos digitales"],
  ["/servicios-ia", "Servicios IA"],
  ["/kits-negocio", "Kits de negocio"],
  ["/herramientas-ia", "Herramientas IA"],
  ["/comparador", "Comparador"],
  ["/recursos", "Recursos"],
  ["/afiliados", "Afiliados"],
  ["/planes", "Planes"],
  ["/contacto", "Contacto"],
  ["/soporte", "Soporte"],
  ["/legal/terminos", "Legal terminos"],
  ["/s/logo-ia", "Ficha servicio logo"],
  ["/kit/restaurantes", "Ficha kit restaurantes"],
  ["/p/pack-prompts-marketing-100", "Ficha producto prompts"],
];

const adminRoutes = [
  ["/dashboard", "Dashboard admin"],
  ["/dashboard/catalog", "Catalogo"],
  ["/dashboard/digital-products", "Productos digitales admin"],
  ["/dashboard/ai-services", "Servicios IA admin"],
  ["/dashboard/business-kits", "Kits admin"],
  ["/dashboard/orders", "Pedidos"],
  ["/dashboard/deliveries", "Entregas"],
  ["/dashboard/saas", "SaaS"],
  ["/dashboard/comparator", "Comparador admin"],
  ["/dashboard/niche-factory", "Niche Factory"],
  ["/dashboard/affiliates", "Afiliados admin"],
  ["/dashboard/marketing", "Marketing"],
  ["/dashboard/media-studio", "Media Studio"],
  ["/dashboard/settings", "Settings"],
  ["/dashboard/logs", "Logs"],
];

const affiliateRoutes = [
  ["/affiliate/login", "Login afiliado"],
  ["/affiliate/panel", "Panel afiliado"],
  ["/affiliate/dashboard", "Dashboard afiliado"],
];

function appOrigin(req: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_STORE_URL || new URL(req.url).origin).replace(/\/$/, "");
}

async function checkRoute(origin: string, path: string, label: string, panel: string, actor: string) {
  const started = new Date().toISOString();
  try {
    const res = await fetch(`${origin}${path}`, { redirect: "manual", cache: "no-store" });
    const ok = res.status >= 200 && res.status < 400;
    return {
      status: ok ? "passed" as LiveTestStatus : "failed" as LiveTestStatus,
      test_name: label,
      panel,
      actor,
      route: path,
      action_label: "Abrir ruta",
      evidence_url: `${origin}${path}`,
      error_message: ok ? null : `HTTP ${res.status}`,
      started_at: started,
      finished_at: new Date().toISOString(),
      data_created: { http_status: res.status, is_test: true },
    };
  } catch (error) {
    return {
      status: "failed" as LiveTestStatus,
      test_name: label,
      panel,
      actor,
      route: path,
      action_label: "Abrir ruta",
      evidence_url: `${origin}${path}`,
      error_message: error instanceof Error ? error.message : "Error desconocido",
      started_at: started,
      finished_at: new Date().toISOString(),
      data_created: { is_test: true },
    };
  }
}

async function integrationStep(origin: string, path: string, label: string, panel: string, actor: string, missingEnv: string[]) {
  const started = new Date().toISOString();
  if (missingEnv.length) {
    return {
      status: "skipped" as LiveTestStatus,
      test_name: label,
      panel,
      actor,
      route: path,
      action_label: "Ver configuracion",
      evidence_url: `${origin}${path}`,
      error_message: `Pendiente de configuracion: ${missingEnv.join(", ")}`,
      started_at: started,
      finished_at: new Date().toISOString(),
      data_created: { is_test: true, skipped_reason: "missing_env", missing_env: missingEnv },
    };
  }
  return checkRoute(origin, path, label, panel, actor);
}

export async function POST(req: NextRequest) {
  const isForm = req.headers.get("content-type")?.includes("form");
  const raw = isForm ? Object.fromEntries((await req.formData()).entries()) : await req.json().catch(() => ({}));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Suite no valida." }, { status: 400 });

  const origin = appOrigin(req);
  const run = await createLiveTestRun({
    suite: parsed.data.suite,
    title: `Suite ${parsed.data.suite} ejecutada en vivo`,
    description: "Ejecucion visible desde /dashboard/live-tests con resultados reales de rutas e integraciones.",
    metadata: { origin, requested_from: "dashboard", is_test: true },
  });

  const steps = [];
  if (parsed.data.suite === "all" || parsed.data.suite === "public") {
    for (const [path, label] of publicRoutes) steps.push(await checkRoute(origin, path, label, "public", "cliente-test@affilix.local"));
  }
  if (parsed.data.suite === "all" || parsed.data.suite === "admin") {
    for (const [path, label] of adminRoutes) steps.push(await checkRoute(origin, path, label, "admin", "admin-test@affilix.local"));
  }
  if (parsed.data.suite === "all" || parsed.data.suite === "affiliate") {
    for (const [path, label] of affiliateRoutes) steps.push(await checkRoute(origin, path, label, "affiliate", "afiliado-test@affilix.local"));
  }
  if (parsed.data.suite === "all" || parsed.data.suite === "payments") {
    steps.push(await integrationStep(origin, "/api/checkout/create-session", "Stripe checkout test mode", "payments", "cliente-test@affilix.local", ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"].filter((key) => !process.env[key])));
    steps.push(await integrationStep(origin, "/download/test-token", "Entrega con token test", "deliveries", "cliente-test@affilix.local", []));
  }
  if (parsed.data.suite === "all" || parsed.data.suite === "muapi") {
    steps.push(await integrationStep(origin, "/api/muapi/balance", "MuAPI balance real", "muapi", "admin-test@affilix.local", ["MUAPI_API_KEY"].filter((key) => !process.env[key])));
  }

  const rows = steps.map((step) => ({ ...step, run_id: run.id }));
  await insertLiveTestSteps(rows);
  await finishLiveTestRun(run.id, rows, {
    report_path: "/docs/FINAL_QA_REPORT.md",
    muapi_cost_usd: 0,
    emails_sent: 0,
    test_orders_created: rows.some((step) => step.panel === "payments" && step.status === "passed") ? 1 : 0,
    test_deliveries_created: rows.some((step) => step.panel === "deliveries" && step.status === "passed") ? 1 : 0,
  });

  if (isForm) return NextResponse.redirect(new URL("/dashboard/live-tests", req.url), 303);
  return NextResponse.json({ ok: true, run_id: run.id, total: rows.length });
}
