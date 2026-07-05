import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";
import { getAllDigitalCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function AIServicesPage() {
  const items = await getAllDigitalCatalog();
  return (
    <AdminModulePage
      title="Servicios IA"
      description="Servicios generativos bajo demanda: logos, flyers, guiones, video, voz, ebooks, campanas y recursos personalizados."
      items={items}
      itemTypes={["service_template"]}
      emptyTitle="Centro de servicios IA"
      emptyMessage="Aqui se publican servicios como logos, flyers, videos, voz, ebooks y campanas. Cada pedido crea una ejecucion y entrega el resultado en Media Studio, pedidos y entregas."
      actions={[{ label: "Crear servicio IA", href: "/dashboard/catalog", kind: "primary" }]}
      agent={{ name: "AIServiceAgent", status: "active", description: "Ejecuta pedidos, guarda salidas, registra jobs MuAPI y prepara entregas revisables." }}
      pending={["Entrega final: /dashboard/media-studio/jobs, /dashboard/orders y /dashboard/deliveries.", "Para cobros reales usa Stripe o PayPal live configurado."]}
    />
  );
}
