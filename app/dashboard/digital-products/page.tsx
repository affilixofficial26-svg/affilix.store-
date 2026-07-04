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
      emptyTitle="Aun no tienes productos digitales"
      emptyMessage="Crea el primer PDF, pack, plantilla, ebook o recurso descargable y activa la entrega automatica cuando tengas archivo real."
      actions={[{ label: "Crear producto digital", href: "/dashboard/catalog", kind: "primary" }]}
      agent={{ name: "DigitalProductAgent", status: "pending", description: "Prepara descripcion, SEO, portada y validacion de entrega. Queda pendiente hasta configurar proveedor IA y storage privado." }}
      pending={["Configura SUPABASE_STORAGE_BUCKET_DIGITAL_ASSETS para archivos privados.", "Configura OPENAI_API_KEY o proveedor IA antes de generar portadas/descripciones."]}
    />
  );
}
