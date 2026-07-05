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

function publicText(value: string | null | undefined) {
  return (value || "")
    .replace(/\bMuAPI\b/gi, "proceso interno")
    .replace(/\bIA\b/gi, "")
    .replace(/\bAI\b/gi, "")
    .replace(/\bAPI\b/gi, "conexion")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function CatalogCard({ item }: { item: DigitalCatalogItem }) {
  const href = `${detailPrefixes[item.item_type]}/${item.slug}`;
  const price = item.price == null ? "Consultar" : new Intl.NumberFormat("es-ES", { style: "currency", currency: item.currency || "EUR" }).format(Number(item.price));
  const cta = item.item_type === "service_template" ? "Empezar" : "Ver detalle";
  const title = publicText(item.title);
  const category = publicText(item.category || item.item_type.replaceAll("_", " "));
  const description = publicText(item.short_description || item.description || "Informacion completa disponible en la ficha.");

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-white/10 bg-[#10141e] transition hover:border-[#38bdf8]/60">
      <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-[#171c28]">
        {item.image_url ? (
          <Image src={item.image_url} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center p-8">
            <Image src="/affilix-mark.svg" alt="" width={72} height={72} className="h-16 w-16 opacity-60" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="text-xs font-black uppercase text-[#38bdf8]">{category}</div>
        <h2 className="mt-2 font-display text-xl font-black text-white">{title}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{description}</p>
        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <span className="text-lg font-black text-white">{price}</span>
          <Link href={href} className="rounded-md border border-white/15 px-3 py-2 text-sm font-black text-white hover:border-[#38bdf8] hover:text-[#7dd3fc]">{cta}</Link>
        </div>
      </div>
    </article>
  );
}
