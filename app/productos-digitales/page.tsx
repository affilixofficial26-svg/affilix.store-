import { CatalogPage } from "@/components/digital-hub/CatalogPage";
import { getDigitalHubCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function DigitalProductsPage() {
  const catalog = await getDigitalHubCatalog();
  return (
    <CatalogPage
      eyebrow="Catálogo propio"
      title="Productos digitales preparados para crear, vender y trabajar mejor."
      description="Explora plantillas, ebooks, packs, guías, prompts y recursos descargables publicados desde AFFILIX Digital Hub."
      items={catalog.products}
      emptyTitle="Todavía no hay productos digitales publicados"
      emptyMessage="El catálogo solo mostrará productos reales y revisados. Los productos físicos y los elementos demo han quedado fuera de esta sección."
    />
  );
}

