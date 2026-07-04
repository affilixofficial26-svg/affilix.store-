import { AdminCatalogList } from "@/components/digital-hub/AdminCatalogList";
import { getAllDigitalCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function SaasAdminPage() {
  const items = await getAllDigitalCatalog();
  return <div className="space-y-6"><div><h1 className="font-display text-3xl font-bold">SaaS y herramientas</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Ofertas digitales curadas, comparativas y enlaces afiliados comprobados.</p></div><AdminCatalogList items={items} types={["saas_offer"]} /></div>;
}

