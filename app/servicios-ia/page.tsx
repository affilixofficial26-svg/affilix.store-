import { CatalogPage } from "@/components/digital-hub/CatalogPage";
import { getDigitalHubCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function AiServicesPage() {
  const catalog = await getDigitalHubCatalog();
  return (
    <CatalogPage
      eyebrow="Producción asistida"
      title="Servicios IA con una entrega clara y un proceso controlado."
      description="Diseño, vídeo, texto, web, música y marketing organizados como servicios, con datos de entrada, ejecución y entrega."
      items={catalog.services}
      emptyTitle="Los servicios IA están en configuración"
      emptyMessage="Aquí aparecerán únicamente servicios con precio, formulario, flujo de producción y entrega definidos."
    />
  );
}

