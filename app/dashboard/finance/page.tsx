import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";

export default function FinancePage() {
  return (
    <AdminModulePage
      title="Finanzas"
      description="Ingresos, Stripe, PayPal, reembolsos, comisiones, suscripciones, creditos IA, costes, margen y exportaciones."
      emptyTitle="No hay eventos financieros reales"
      emptyMessage="El panel mostrara importes cuando Stripe, PayPal o registros manuales creen finance_events."
      actions={[{ label: "Configurar pagos", href: "/dashboard/integrations", kind: "primary" }]}
      agent={{ name: "FinanceAgent", status: "pending", description: "Resume ingresos, costes y comisiones sin inventar metricas." }}
      pending={["Configura STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET.", "Configura PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET si PayPal se activa."]}
    />
  );
}
