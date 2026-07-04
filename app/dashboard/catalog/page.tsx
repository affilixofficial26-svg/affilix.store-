import { AdminCatalogList } from "@/components/digital-hub/AdminCatalogList";
import { getAllDigitalCatalog } from "@/lib/digital-hub";

export const dynamic = "force-dynamic";

export default async function MasterCatalogPage({ searchParams }: { searchParams?: Promise<{ status?: string; error?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const items = await getAllDigitalCatalog();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase text-[var(--accent-blue)]">AFFILIX Digital Hub</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Catálogo maestro</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Una sola fuente para productos digitales, servicios, kits, SaaS, bundles y recursos.</p>
      </div>
      {params.status === "created" ? <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">Elemento creado correctamente.</div> : null}
      {params.error ? <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">No se pudo guardar. Revisa los campos y confirma que la migración 015 está aplicada.</div> : null}
      <form action="/api/catalog/items" method="post" className="surface grid gap-4 p-5 lg:grid-cols-2">
        <div className="lg:col-span-2"><h2 className="font-display text-xl font-bold">Crear elemento</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">No publiques hasta tener precio, entrega y contenido reales.</p></div>
        <label className="text-xs font-bold">Tipo<select className="input mt-2" name="item_type" required><option value="digital_product">Producto digital</option><option value="service_template">Servicio IA</option><option value="business_kit">Kit de negocio</option><option value="saas_offer">Oferta SaaS</option><option value="bundle">Bundle</option><option value="lead_magnet">Recurso gratuito</option><option value="subscription_plan">Plan</option></select></label>
        <label className="text-xs font-bold">Título<input className="input mt-2" name="title" minLength={3} maxLength={180} required /></label>
        <label className="text-xs font-bold lg:col-span-2">Descripción corta<input className="input mt-2" name="short_description" maxLength={500} /></label>
        <label className="text-xs font-bold lg:col-span-2">Descripción<textarea className="input mt-2 min-h-28" name="description" maxLength={10000} /></label>
        <label className="text-xs font-bold">Categoría<input className="input mt-2" name="category" maxLength={100} /></label>
        <label className="text-xs font-bold">URL de imagen<input className="input mt-2" name="image_url" type="url" /></label>
        <label className="text-xs font-bold">Precio<input className="input mt-2" name="price" type="number" min="0" step="0.01" /></label>
        <label className="text-xs font-bold">Moneda<input className="input mt-2" name="currency" defaultValue="EUR" maxLength={3} required /></label>
        <label className="text-xs font-bold">Entrega<select className="input mt-2" name="delivery_type" required><option value="download">Descarga</option><option value="service">Servicio</option><option value="external">Enlace externo / SaaS</option><option value="access">Acceso</option></select></label>
        <label className="text-xs font-bold">URL externa<input className="input mt-2" name="external_url" type="url" /></label>
        <label className="text-xs font-bold">Estado<select className="input mt-2" name="status" defaultValue="draft"><option value="draft">Borrador</option><option value="review">Revisión</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label>
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="featured" /> Destacado</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="commercial_use" /> Uso comercial</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="affiliate_disclosure" /> Enlace afiliado</label>
        </div>
        <button className="btn btn-primary lg:col-span-2" type="submit">Guardar en catálogo</button>
      </form>
      <AdminCatalogList items={items} />
    </div>
  );
}

