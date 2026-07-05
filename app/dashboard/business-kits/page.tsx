import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";
import { getAllDigitalCatalog } from "@/lib/digital-hub";
import { isAiAvailable } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

export default async function BusinessKitsPage() {
  const items = await getAllDigitalCatalog();
  const canGenerate = isAiAvailable("text") && isAiAvailable("image");
  return (
    <AdminModulePage
      title="Kits de Negocio"
      description="Packs por vertical con logo, flyer, posts, textos, landing copy, catalogo, prompts y campanas."
      items={items}
      itemTypes={["business_kit"]}
      emptyTitle="Aun no hay kits de negocio"
      emptyMessage="Crea kits por sector solo cuando tengas componentes reales, precio, alcance y proceso de entrega definido."
      actions={[{ label: "Crear kit", href: "/dashboard/catalog", kind: "primary" }]}
      agent={{ name: "BusinessKitAgent", status: canGenerate ? "active" : "pending", description: "Propone piezas por vertical y prepara borradores con MuAPI." }}
      pending={canGenerate ? [] : ["MuAPI debe estar disponible para texto e imagen antes de generar piezas del kit."]}
    />
  );
}
