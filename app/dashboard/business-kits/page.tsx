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
      emptyTitle="Centro de kits de negocio"
      emptyMessage="Aqui se preparan kits por sector con piezas reales: logo, flyers, posts, copies, prompts, landing copy y campanas."
      actions={[{ label: "Crear kit", href: "/dashboard/catalog", kind: "primary" }]}
      agent={{ name: "BusinessKitAgent", status: "active", description: "Propone piezas por vertical y prepara borradores con MuAPI cuando el motor esta disponible." }}
      pending={canGenerate ? ["Motor IA texto+imagen disponible para generar piezas del kit."] : ["Modo visible activo. Para generacion real con coste, conecta MuAPI texto+imagen."]}
    />
  );
}
