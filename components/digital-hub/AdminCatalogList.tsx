import Link from "next/link";
import type { DigitalCatalogItem, DigitalItemType } from "@/lib/digital-hub";

const labels: Record<DigitalItemType, string> = {
  digital_product: "Producto digital",
  saas_offer: "Oferta SaaS",
  service_template: "Servicio IA",
  business_kit: "Kit de negocio",
  bundle: "Bundle",
  lead_magnet: "Recurso",
  subscription_plan: "Plan",
};

export function AdminCatalogList({ items, types }: { items: DigitalCatalogItem[]; types?: DigitalItemType[] }) {
  const visible = types ? items.filter((item) => types.includes(item.item_type)) : items;
  if (!visible.length) {
    return <div className="surface p-8 text-center text-sm text-[var(--text-secondary)]">No hay elementos reales en esta sección. Crea el primero desde Catálogo maestro.</div>;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--bg-elevated)] text-xs uppercase text-[var(--text-muted)]">
          <tr><th className="px-4 py-3">Elemento</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Precio</th><th className="px-4 py-3">Público</th></tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {visible.map((item) => (
            <tr key={item.id} className="bg-[var(--bg-surface)]">
              <td className="px-4 py-4"><div className="font-bold text-white">{item.title}</div><div className="mt-1 text-xs text-[var(--text-muted)]">{item.category || "Sin categoría"}</div></td>
              <td className="px-4 py-4">{labels[item.item_type]}</td>
              <td className="px-4 py-4">{item.status}</td>
              <td className="px-4 py-4">{item.price == null ? "Sin precio" : `${Number(item.price).toFixed(2)} ${item.currency}`}</td>
              <td className="px-4 py-4">{item.status === "published" ? <Link className="text-[var(--accent-blue)]" href={publicHref(item)}>Abrir</Link> : "No publicado"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function publicHref(item: DigitalCatalogItem) {
  if (item.item_type === "service_template") return `/s/${item.slug}`;
  if (item.item_type === "business_kit") return `/kit/${item.slug}`;
  if (item.item_type === "saas_offer") return `/tools/${item.slug}`;
  return `/p/${item.slug}`;
}

