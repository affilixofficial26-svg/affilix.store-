import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";

export default function LogsPage() {
  return (
    <AdminModulePage
      title="Logs del Sistema"
      description="Unifica agent_logs, automation_logs, payment_logs, delivery_logs, email_logs, marketing_logs, error_logs y security_logs."
      emptyTitle="No hay logs unificados visibles"
      emptyMessage="Los logs apareceran cuando endpoints, agentes, automatizaciones, pagos o entregas registren eventos reales."
      actions={[{ label: "Ver automatizaciones", href: "/dashboard/automation", kind: "primary" }]}
      agent={{ name: "QAAgent", status: "pending", description: "Revisa errores recientes y paneles incompletos cuando exista proveedor IA configurado." }}
      pending={["Aplica la migracion 015 para tablas de logs.", "Configura CRON_SECRET antes de automatizaciones programadas."]}
    />
  );
}
