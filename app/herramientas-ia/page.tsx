import { CatalogPage } from "@/components/digital-hub/CatalogPage";
import { getDigitalHubCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function AiToolsPage() {
  const catalog = await getDigitalHubCatalog();
  return (
    <CatalogPage
      eyebrow="SaaS curado"
      title="Herramientas IA y software elegidos por utilidad real."
      description="Análisis de vídeo, imagen, voz, música, web, marketing, automatización, hosting, SEO y email. Algunas recomendaciones pueden utilizar enlaces afiliados."
      items={catalog.tools}
      emptyTitle="Todavía no hay herramientas verificadas"
      emptyMessage="AFFILIX no mostrará listados genéricos. Cada herramienta se publicará con análisis, precio, ventajas, límites y enlace comprobado."
    />
  );
}

