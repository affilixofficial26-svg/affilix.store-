import Link from "next/link";
import { PageIntro, PublicShell } from "@/components/digital-hub/PublicShell";

const goals = [
  ["Crear vídeos con IA", "Vídeo"],
  ["Vender productos digitales", "Comercio digital"],
  ["Diseñar logos y marca", "Diseño"],
  ["Montar una web", "Web"],
  ["Automatizar redes", "Marketing"],
  ["Crear música con IA", "Audio"],
  ["Crear contenido para un negocio", "Negocio"],
];

export default function ComparatorPage() {
  return (
    <PublicShell>
      <PageIntro eyebrow="Comparador inteligente" title="Empieza por tu objetivo, no por una lista interminable de herramientas." description="AFFILIX organiza las opciones por coste, facilidad, resultado y tipo de usuario para que puedas tomar una decisión informada." />
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-6">
        <h2 className="font-display text-2xl font-black text-white">¿Qué quieres conseguir?</h2>
        <div className="mt-7 grid border-l border-t border-white/10 md:grid-cols-2 xl:grid-cols-3">
          {goals.map(([goal, category]) => (
            <Link key={goal} href={`/herramientas-ia?categoria=${encodeURIComponent(category)}`} className="min-h-40 border-b border-r border-white/10 bg-[#10141e] p-6 hover:bg-[#151b28]">
              <div className="text-xs font-black uppercase text-[#38bdf8]">{category}</div>
              <h3 className="mt-4 font-display text-xl font-black text-white">{goal}</h3>
              <p className="mt-3 text-sm text-slate-400">Ver herramientas verificadas →</p>
            </Link>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}

