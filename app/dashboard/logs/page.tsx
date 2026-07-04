import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";
import { getAdminDb } from "@/lib/supabase";

async function logsReady() {
  try {
    await getAdminDb().select("system_logs", { select: "id", limit: "1" });
    await getAdminDb().select("cron_logs", { select: "id", limit: "1" });
    await getAdminDb().select("webhook_logs", { select: "id", limit: "1" });
    return true;
  } catch {
    return false;
  }
}

function cronReady() {
  return Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 32);
}

export default async function LogsPage() {
  const pending = [];
  if (!(await logsReady())) pending.push("Aplica migraciones de logs en Supabase.");
  if (!cronReady()) pending.push("Configura CRON_SECRET antes de automatizaciones programadas.");

  return (
    <AdminModulePage
      title="Logs del Sistema"
      description="Unifica logs del sistema, webhooks, crons, agentes y eventos de automatizacion."
      emptyTitle="No hay logs unificados visibles"
      emptyMessage="Los logs apareceran cuando endpoints, agentes, automatizaciones, pagos o entregas registren eventos reales."
      actions={[{ label: "Ver automatizaciones", href: "/dashboard/automation", kind: "primary" }]}
      agent={{ name: "QAAgent", status: "pending", description: "Revisa errores recientes y paneles incompletos cuando exista proveedor IA configurado." }}
      pending={pending}
    />
  );
}
