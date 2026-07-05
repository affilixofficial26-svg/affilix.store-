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
      emptyTitle="Centro de entregas"
      emptyMessage="Cada compra pagada crea una entrega con token seguro. Aqui ves descargas, expiracion, reenvios y errores de entrega."
      actions={[{ label: "Ver pedidos", href: "/dashboard/orders", kind: "primary" }]}
      agent={{ name: "DeliveryAgent", status: "active", description: "Reintenta entregas fallidas, genera enlaces firmados y registra errores." }}
      pending={["Resultado para cliente: /download/[token].", "Emails: Resend envia enlace cuando EMAIL_FROM esta activo."]}
    />
  );
}
