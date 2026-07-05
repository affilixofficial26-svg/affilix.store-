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
      emptyTitle="Centro de comparativas"
      emptyMessage="Aqui se crean comparativas para herramientas IA y SaaS. Las fichas publicas aparecen en /comparador y /tools/[slug]."
      actions={[{ label: "Agregar herramienta", href: "/dashboard/saas", kind: "primary" }]}
      agent={{ name: "ComparatorAgent", status: "active", description: "Ordena herramientas y redacta comparativas con datos verificables, sin inventar conversiones ni comisiones." }}
      pending={["Salida publica: /comparador, /herramientas-ia y /tools/[slug].", "Usa solo herramientas verificadas o enlaces afiliados oficiales."]}
    />
  );
}
