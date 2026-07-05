import { CatalogPage } from "@/components/digital-hub/CatalogPage";
import { getDigitalHubCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const catalog = await getDigitalHubCatalog();
  return (
    <CatalogPage
      eyebrow="SaaS curado"
      title="Herramientas y software elegidos por utilidad real."
      description="Analisis de video, imagen, voz, musica, web, marketing, automatizacion, hosting, SEO y email. Algunas recomendaciones pueden utilizar enlaces afiliados."
      items={catalog.tools}
      emptyTitle="Catalogo en revision"
      emptyMessage="AFFILIX no muestra listados genericos. Cada herramienta se publica con analisis, precio, ventajas, limites y enlace comprobado."
    />
  );
}
