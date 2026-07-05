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
      emptyTitle="No hay servicios IA publicados"
      emptyMessage="Crea una plantilla de servicio con precio, formulario, prompt interno y flujo de revision antes de venderla."
      actions={[{ label: "Crear servicio IA", href: "/dashboard/catalog", kind: "primary" }]}
      agent={{ name: "AIServiceAgent", status: "pending", description: "Ejecuta pedidos, guarda salidas y prepara entregas. No genera resultados hasta tener API key de IA configurada." }}
      pending={["Define plantillas de entrada y revision humana para cada servicio."]}
    />
  );
}
