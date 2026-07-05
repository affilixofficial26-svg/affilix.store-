import Link from "next/link";
import { PageIntro, PublicShell } from "@/components/digital-hub/PublicShell";

const benefits = [
  ["Escaparate propio", "Una pagina individual con los activos digitales que decides recomendar."],
  ["Enlaces personalizados", "Tracking por afiliado y producto para medir el trafico correctamente."],
  ["Comisiones", "Historial separado por estado, producto y reparto."],
  ["Material promocional", "Copies y activos preparados para publicar."],
  ["Analitica", "Clics, ventas, conversion y evolucion desde un unico panel."],
  ["Herramientas digitales", "Productos propios, servicios creativos, kits y SaaS curado."],
];

export default function AffiliatesLandingPage() {
  return (
    <PublicShell>
      <PageIntro eyebrow="AFFILIX Partners" title="Gana comisiones recomendando soluciones digitales utiles." description="Publica productos digitales, servicios creativos, kits y herramientas SaaS desde un escaparate propio con tracking y analitica." />
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <div className="grid border-l border-t border-white/10 md:grid-cols-2 xl:grid-cols-3">
          {benefits.map(([title, copy]) => (
            <div key={title} className="min-h-44 border-b border-r border-white/10 bg-[#10141e] p-6">
              <h2 className="font-display text-xl font-black text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/affiliate/login" className="rounded-md bg-[#38bdf8] px-5 py-3 text-sm font-black text-[#04111b] hover:bg-[#7dd3fc]">Entrar al panel</Link>
          <Link href="/login" className="rounded-md border border-white/20 px-5 py-3 text-sm font-black text-white hover:border-[#38bdf8]">Contactar con administracion</Link>
        </div>
      </section>
    </PublicShell>
  );
}
