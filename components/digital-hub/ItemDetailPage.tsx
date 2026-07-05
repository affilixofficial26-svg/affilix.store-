import Image from "next/image";
import Link from "next/link";
import { HonestEmptyState, PublicShell } from "@/components/digital-hub/PublicShell";
import { getDigitalCatalogItem, getServiceTemplateByCatalogItem } from "@/lib/digital-hub";
import { BuyButton } from "@/components/checkout/BuyButton";

function publicText(value: string | null | undefined) {
  return (value || "")
    .replace(/\bMuAPI\b/gi, "proceso interno")
    .replace(/\bIA\b/gi, "")
    .replace(/\bAI\b/gi, "")
    .replace(/\bAPI\b/gi, "conexion")
    .replace(/\s{2,}/g, " ")
    .trim();
}

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
          <HonestEmptyState title="Contenido no encontrado" message="Este elemento no existe, no esta publicado o pertenece a otra seccion del Digital Hub." />
        </section>
      </PublicShell>
    );
  }

  const serviceTemplate = expectedType === "service" ? await getServiceTemplateByCatalogItem(item.id) : null;
  const schemaEntries = serviceTemplate?.input_schema && typeof serviceTemplate.input_schema === "object"
    ? Object.entries(serviceTemplate.input_schema).slice(0, 8)
    : [];
  const price = item.price == null ? "Consultar" : new Intl.NumberFormat("es-ES", { style: "currency", currency: item.currency || "EUR" }).format(Number(item.price));
  const isExternal = item.delivery_type === "external" && item.external_url;
  const metadata = item.metadata || {};
  const deliveryHours = String(serviceTemplate?.estimated_delivery_hours ?? metadata.turnaround_hours ?? 24);
  const revisions = String(serviceTemplate?.included_revisions ?? serviceTemplate?.revision_limit ?? metadata.revisions ?? 1);
  const title = publicText(item.title);
  const category = publicText(item.category || item.item_type.replaceAll("_", " "));
  const description = publicText(item.description || item.short_description);

  return (
    <PublicShell>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1fr_1fr] lg:px-6 lg:py-20">
        <div className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-[#10141e]">
          {item.image_url ? <Image src={item.image_url} alt={title} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /> : <div className="flex h-full items-center justify-center"><Image src="/affilix-mark.svg" alt="" width={110} height={110} className="opacity-60" /></div>}
        </div>
        <div className="flex flex-col justify-center">
          <div className="text-xs font-black uppercase text-[#38bdf8]">{category}</div>
          <h1 className="mt-4 font-display text-4xl font-black leading-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-5 text-base leading-7 text-slate-300">{description}</p>
          <div className="mt-7 text-3xl font-black text-white">{price}</div>
          {serviceTemplate ? (
            <div className="mt-5 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
              <div className="border border-white/10 bg-white/[.03] p-3"><strong className="block text-white">{deliveryHours}h</strong> entrega estimada</div>
              <div className="border border-white/10 bg-white/[.03] p-3"><strong className="block text-white">{revisions}</strong> revisiones</div>
              <div className="border border-white/10 bg-white/[.03] p-3"><strong className="block text-white">Revisado</strong> proceso interno</div>
            </div>
          ) : null}
          {isExternal ? (
            <Link href={item.external_url!} target="_blank" rel="sponsored noreferrer" className="mt-7 w-fit rounded-md bg-[#38bdf8] px-5 py-3 text-sm font-black text-[#04111b] hover:bg-[#7dd3fc]">Ir a la herramienta</Link>
          ) : (
            item.price != null ? <BuyButton itemId={item.id} label={expectedType === "service" ? "Comprar y empezar" : "Comprar ahora"} /> : <div className="mt-7 border-l-2 border-[#38bdf8] bg-[#10141e] p-4 text-sm leading-6 text-slate-300">Este elemento todavia no tiene un precio configurado.</div>
          )}
          {item.affiliate_disclosure ? <p className="mt-5 text-xs leading-5 text-slate-500">Este enlace puede generar una comision para AFFILIX sin coste adicional para ti.</p> : null}
        </div>
      </section>

      {serviceTemplate ? (
        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 lg:grid-cols-[1.2fr_.8fr] lg:px-6">
          <div className="border border-white/10 bg-[#10141e] p-6">
            <h2 className="font-display text-2xl font-black text-white">Formulario de briefing</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {schemaEntries.map(([name, config]) => {
                const field = config as { label?: string; type?: string; required?: boolean };
                return (
                  <label key={name} className="text-sm font-bold text-white">
                    {field.label || name.replaceAll("_", " ")} {field.required ? <span className="text-[#38bdf8]">*</span> : null}
                    <input className="input mt-2" disabled placeholder={field.type || "text"} />
                  </label>
                );
              })}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">El briefing se recoge durante el pedido y queda asociado al proceso de produccion.</p>
          </div>
          <div className="border border-white/10 bg-[#10141e] p-6">
            <h2 className="font-display text-2xl font-black text-white">Que incluye</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>Proceso de produccion configurado y trazable.</li>
              <li>Revision humana incluida antes de la entrega final.</li>
              <li>Entrega digital con token y email.</li>
              <li>Licencia comercial estandar.</li>
            </ul>
          </div>
        </section>
      ) : null}
    </PublicShell>
  );
}
