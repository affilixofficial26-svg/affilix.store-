import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";

export default function FinancePage() {
  const checks = [
    !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET
      ? "Stripe en checklist: configura STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET para cobros reales."
      : null,
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
      ? null
      : "PayPal en checklist: requiere PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET para cobros reales.",
  ].filter((message): message is string => Boolean(message));

  return (
    <AdminModulePage
      title="Finanzas"
      description="Ingresos, Stripe, PayPal, reembolsos, comisiones, suscripciones, creditos IA, costes, margen y exportaciones."
      emptyTitle="Centro financiero"
      emptyMessage="Aqui se ven ventas, costes IA, comisiones, reembolsos y eventos creados por Stripe, PayPal o registros internos."
      actions={[{ label: "Configurar pagos", href: "/dashboard/integrations", kind: "primary" }]}
      agent={{ name: "FinanceAgent", status: "active", description: "Resume ingresos, costes y comisiones usando finance_events y pedidos pagados." }}
      pending={checks}
    />
  );
}
