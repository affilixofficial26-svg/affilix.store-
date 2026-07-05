import { CatalogPage } from "@/components/digital-hub/CatalogPage";
import { getDigitalHubCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function CreativeServicesPage() {
  const catalog = await getDigitalHubCatalog();
  return (
    <CatalogPage
      eyebrow="Produccion creativa"
      title="Servicios digitales con entrega clara y proceso controlado."
      description="Diseno, video, texto, web, musica y marketing organizados como servicios, con briefing, revision y entrega final."
      items={catalog.services}
      emptyTitle="Catalogo en actualizacion"
      emptyMessage="Estamos revisando los servicios activos. Vuelve en unos segundos."
    />
  );
}
