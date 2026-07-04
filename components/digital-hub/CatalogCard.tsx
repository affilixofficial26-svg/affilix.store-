import Image from "next/image";
import Link from "next/link";
import type { DigitalCatalogItem } from "@/lib/digital-hub";

const detailPrefixes: Record<DigitalCatalogItem["item_type"], string> = {
  digital_product: "/p",
  bundle: "/p",
  lead_magnet: "/recursos",
  subscription_plan: "/productos-digitales",
  service_template: "/s",
  business_kit: "/kit",
  saas_offer: "/tools",
};

export function CatalogCard({ item }: { item: DigitalCatalogItem }) {
  const href = `${detailPrefixes[item.item_type]}/${item.slug}`;
  const price = item.price == null ? "Consultar" : new Intl.NumberFormat("es-ES", { style: "currency", currency: item.currency || "EUR" }).format(Number(item.price));
  return (
    <article className="group flex h-full flex-col overflow-hidden border border-white/10 bg-[#10141e] transition hover:border-[#38bdf8]/60">
      <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-[#171c28]">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center p-8">
            <Image src="/affilix-mark.svg" alt="" width={72} height={72} className="h-16 w-16 opacity-60" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="text-xs font-black uppercase text-[#38bdf8]">{item.category || item.item_type.replaceAll("_", " ")}</div>
        <h2 className="mt-2 font-display text-xl font-black text-white">{item.title}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{item.short_description || item.description || "Información completa disponible en la ficha."}</p>
        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <span className="text-lg font-black text-white">{price}</span>
          <Link href={href} className="rounded-md border border-white/15 px-3 py-2 text-sm font-black text-white hover:border-[#38bdf8] hover:text-[#7dd3fc]">Ver detalle</Link>
        </div>
      </div>
    </article>
  );
}

