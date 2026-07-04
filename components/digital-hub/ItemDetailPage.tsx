import Image from "next/image";
import Link from "next/link";
import { HonestEmptyState, PublicShell } from "@/components/digital-hub/PublicShell";
import { getDigitalCatalogItem } from "@/lib/digital-hub";
import { BuyButton } from "@/components/checkout/BuyButton";

export async function ItemDetailPage({ slug, expectedType }: { slug: string; expectedType: "product" | "service" | "kit" | "tool" }) {
  const item = await getDigitalCatalogItem(slug);
  const validTypes = {
    product: ["digital_product", "bundle"],
    service: ["service_template"],
    kit: ["business_kit"],
    tool: ["saas_offer"],
  } as const;
  const valid = item && (validTypes[expectedType] as readonly string[]).includes(item.item_type);

  if (!valid || !item) {
    return (
      <PublicShell>
        <section className="mx-auto max-w-4xl px-4 py-24">
          <HonestEmptyState title="Contenido no encontrado" message="Este elemento no existe, no está publicado o pertenece a otra sección del Digital Hub." />
        </section>
      </PublicShell>
    );
  }

  const price = item.price == null ? "Consultar" : new Intl.NumberFormat("es-ES", { style: "currency", currency: item.currency || "EUR" }).format(Number(item.price));
  const isExternal = item.delivery_type === "external" && item.external_url;
  return (
    <PublicShell>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1fr_1fr] lg:px-6 lg:py-20">
        <div className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-[#10141e]">
          {item.image_url ? <Image src={item.image_url} alt={item.title} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /> : <div className="flex h-full items-center justify-center"><Image src="/affilix-mark.svg" alt="" width={110} height={110} className="opacity-60" /></div>}
        </div>
        <div className="flex flex-col justify-center">
          <div className="text-xs font-black uppercase text-[#38bdf8]">{item.category || item.item_type.replaceAll("_", " ")}</div>
          <h1 className="mt-4 font-display text-4xl font-black leading-tight text-white sm:text-5xl">{item.title}</h1>
          <p className="mt-5 text-base leading-7 text-slate-300">{item.description || item.short_description}</p>
          <div className="mt-7 text-3xl font-black text-white">{price}</div>
          {isExternal ? (
            <Link href={item.external_url!} target="_blank" rel="sponsored noreferrer" className="mt-7 w-fit rounded-md bg-[#38bdf8] px-5 py-3 text-sm font-black text-[#04111b] hover:bg-[#7dd3fc]">Ir a la herramienta</Link>
          ) : (
            item.price != null ? <BuyButton itemId={item.id} /> : <div className="mt-7 border-l-2 border-[#38bdf8] bg-[#10141e] p-4 text-sm leading-6 text-slate-300">Este elemento todavía no tiene un precio configurado.</div>
          )}
          {item.affiliate_disclosure ? <p className="mt-5 text-xs leading-5 text-slate-500">Este enlace puede generar una comisión para AFFILIX sin coste adicional para ti.</p> : null}
        </div>
      </section>
    </PublicShell>
  );
}
