import { CatalogPage } from "@/components/digital-hub/CatalogPage";
import { getDigitalHubCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function BusinessKitsPage() {
  const catalog = await getDigitalHubCatalog();
  return (
    <CatalogPage
      eyebrow="Soluciones por sector"
      title="Kits completos para poner en marcha la comunicación de un negocio."
      description="Paquetes para restaurantes, barberías, tiendas, inmobiliarias, músicos, eventos, creadores y otros sectores."
      items={catalog.kits}
      emptyTitle="Los kits de negocio están en preparación"
      emptyMessage="Cada kit se publicará cuando tenga contenido, precio, personalización y resultado final completamente definidos."
    />
  );
}

