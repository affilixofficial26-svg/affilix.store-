import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";
import { getAllDigitalCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function BusinessKitsPage() {
  const items = await getAllDigitalCatalog();
  return (
    <AdminModulePage
      title="Kits de Negocio"
      description="Packs por vertical con logo, flyer, posts, textos, landing copy, catalogo, prompts y campanas."
      items={items}
      itemTypes={["business_kit"]}
      emptyTitle="Aun no hay kits de negocio"
      emptyMessage="Crea kits por sector solo cuando tengas componentes reales, precio, alcance y proceso de entrega definido."
      actions={[{ label: "Crear kit", href: "/dashboard/catalog", kind: "primary" }]}
      agent={{ name: "BusinessKitAgent", status: "pending", description: "Propone piezas por vertical y prepara borradores. Requiere proveedor IA antes de generar contenido." }}
      pending={["Configura proveedor IA para generar piezas del kit.", "Carga archivos finales en storage privado antes de publicar."]}
    />
  );
}
