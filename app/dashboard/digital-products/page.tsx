import { AdminModulePage } from "@/components/digital-hub/AdminModulePage";
import { getAllDigitalCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function DigitalProductsPage() {
  const items = await getAllDigitalCatalog();
  return (
    <AdminModulePage
      title="Productos Digitales"
      description="Gestiona PDFs, ZIPs, plantillas, ebooks, packs de prompts y recursos descargables propios."
      items={items}
      itemTypes={["digital_product", "bundle", "lead_magnet"]}
      emptyTitle="Centro de productos digitales"
      emptyMessage="Aqui se crean y editan PDFs, packs, plantillas, ebooks y recursos descargables. Cuando el producto tiene precio y archivo, AFFILIX lo vende y entrega con token seguro."
      actions={[{ label: "Crear producto digital", href: "/dashboard/catalog", kind: "primary" }]}
      agent={{ name: "DigitalProductAgent", status: "active", description: "Prepara descripcion, SEO, portada, archivo y validacion de entrega para cada producto digital." }}
      pending={["Entrega final: /dashboard/deliveries y /download/[token].", "Archivos privados: bucket digital-products o storage configurado en Supabase."]}
    />
  );
}
