import { CatalogPage } from "@/components/digital-hub/CatalogPage";
import { getDigitalHubCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function AiServicesPage() {
  const catalog = await getDigitalHubCatalog();
  return (
    <CatalogPage
      eyebrow="Produccion asistida"
      title="Servicios IA con una entrega clara y un proceso controlado."
      description="Diseno, video, texto, web, musica y marketing organizados como servicios, con datos de entrada, ejecucion y entrega."
      items={catalog.services}
      emptyTitle="Estamos actualizando el catalogo"
      emptyMessage="Recuperando servicios, vuelve en unos segundos."
    />
  );
}
