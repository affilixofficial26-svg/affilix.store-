import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";
import { getAllDigitalCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function NicheFactoryPage() {
  const items = await getAllDigitalCatalog();
  return (
    <AdminModulePage
      title="Fabrica de Nichos"
      description="Analiza oportunidades, problemas de mercado, ideas de producto digital, servicios IA, kits y SaaS recomendado."
      items={items}
      emptyTitle="No hay oportunidades detectadas"
      emptyMessage="El modulo queda preparado para crear borradores de catalogo cuando exista proveedor IA y criterios de scoring."
      actions={[{ label: "Crear borrador en catalogo", href: "/dashboard/catalog", kind: "primary" }]}
      agent={{ name: "NicheFactoryAgent", status: "pending", description: "Analiza nichos y crea oportunidades. No ejecuta analisis automatico sin API key y permisos." }}
      pending={["Configura OPENAI_API_KEY o proveedor IA.", "Define CRON_SECRET antes de activar analisis programado."]}
    />
  );
}
