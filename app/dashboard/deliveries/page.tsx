import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";
import { getAllDigitalCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const items = await getAllDigitalCatalog();
  return (
    <AdminModulePage
      title="Entregas"
      description="Gestiona descargas automaticas, tokens, URLs firmadas, limites, expiracion y reenvio de emails."
      items={items}
      itemTypes={["digital_product", "bundle", "business_kit"]}
      emptyTitle="No hay entregas registradas"
      emptyMessage="Las entregas se crean despues de un pedido pagado. No se permite descarga si el pago no esta confirmado."
      actions={[{ label: "Ver pedidos", href: "/dashboard/orders", kind: "primary" }]}
      agent={{ name: "DeliveryAgent", status: "pending", description: "Reintenta entregas fallidas y registra errores. Requiere storage privado y email transaccional." }}
      pending={["Configura bucket digital-assets privado.", "Configura RESEND_API_KEY y EMAIL_FROM para enviar enlaces."]}
    />
  );
}
