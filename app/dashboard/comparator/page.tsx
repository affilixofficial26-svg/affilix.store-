import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";
import { getAllDigitalCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function ComparatorPage() {
  const items = await getAllDigitalCatalog();
  return (
    <AdminModulePage
      title="Comparador Inteligente"
      description="Crea paginas comparativas para herramientas IA, software, cursos y stacks por caso de uso."
      items={items}
      itemTypes={["saas_offer"]}
      emptyTitle="No hay comparativas listas"
      emptyMessage="Agrega primero herramientas SaaS reales; despues genera tablas, FAQ y SEO con datos verificables."
      actions={[{ label: "Agregar herramienta", href: "/dashboard/saas", kind: "primary" }]}
      agent={{ name: "ComparatorAgent", status: "pending", description: "Ordena herramientas y redacta comparativas sin inventar conversiones ni comisiones." }}
      pending={["Faltan herramientas SaaS verificadas o API key de IA para generar comparativas."]}
    />
  );
}
