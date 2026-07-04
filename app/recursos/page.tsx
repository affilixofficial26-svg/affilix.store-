import { CatalogPage } from "@/components/digital-hub/CatalogPage";
import { getDigitalHubCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const catalog = await getDigitalHubCatalog();
  return (
    <CatalogPage
      eyebrow="Biblioteca"
      title="Recursos gratuitos para validar ideas y empezar más rápido."
      description="Guías, plantillas y materiales de entrada publicados por AFFILIX."
      items={catalog.resources}
      emptyTitle="La biblioteca todavía no tiene recursos publicados"
      emptyMessage="Los nuevos recursos gratuitos aparecerán aquí cuando estén listos para descarga."
    />
  );
}

