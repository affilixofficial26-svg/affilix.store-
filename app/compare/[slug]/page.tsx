import Link from "next/link";
import { PageIntro, PublicShell } from "@/components/digital-hub/PublicShell";

export default async function ComparisonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = slug.replaceAll("-", " ");
  return (
    <PublicShell>
      <PageIntro eyebrow="Comparativa" title={`Comparativa: ${label}`} description="Esta comparativa se publicará cuando existan herramientas verificadas suficientes para ofrecer una recomendación responsable." />
      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="border-l-2 border-[#38bdf8] bg-[#10141e] p-6 text-sm leading-7 text-slate-300">
          AFFILIX no mostrará ganadores, precios ni ventajas inventadas. La tabla se activará después de verificar las fichas SaaS correspondientes.
        </div>
        <Link href="/herramientas-ia" className="mt-7 inline-flex rounded-md border border-white/20 px-5 py-3 text-sm font-black text-white">Ver herramientas disponibles</Link>
      </section>
    </PublicShell>
  );
}

