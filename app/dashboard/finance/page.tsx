import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";

export default function FinancePage() {
  const pending = [
    !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET
      ? "Falta completar la configuración de Stripe."
      : null,
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
      ? null
      : "PayPal requiere PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET para activarse.",
  ].filter((message): message is string => Boolean(message));

  return (
    <AdminModulePage
      title="Finanzas"
      description="Ingresos, Stripe, PayPal, reembolsos, comisiones, suscripciones, creditos IA, costes, margen y exportaciones."
      emptyTitle="No hay eventos financieros reales"
      emptyMessage="El panel mostrara importes cuando Stripe, PayPal o registros manuales creen finance_events."
      actions={[{ label: "Configurar pagos", href: "/dashboard/integrations", kind: "primary" }]}
      agent={{ name: "FinanceAgent", status: "pending", description: "Resume ingresos, costes y comisiones sin inventar metricas." }}
      pending={pending}
    />
  );
}
