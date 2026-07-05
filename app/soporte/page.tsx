import Link from "next/link";
import { LifeBuoy, Search } from "lucide-react";
import { PublicShell } from "@/components/digital-hub/PublicShell";

const faqs = [
  ["Pagos y facturas", "Stripe confirma el pago y AFFILIX genera el pedido y la entrega."],
  ["Descargas y entregas", "Los productos digitales se entregan con token seguro y caducidad."],
  ["Servicios Creativos", "Cada servicio indica formulario, precio, tiempo y revisiones incluidas."],
  ["Programa de afiliados", "Los afiliados aprobados reciben enlaces, materiales y comisiones."],
  ["Cuenta y datos", "Puedes solicitar revision o eliminacion de datos desde soporte."],
  ["Legal", "Las politicas vigentes estan publicadas en la seccion legal."],
];

export default function SupportPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <p className="hub-eyebrow">Soporte</p>
        <h1 className="mt-3 font-display text-5xl font-black text-white">Centro de ayuda AFFILIX.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Respuesta en 24h laborables en horario Espana. Si una entrega falla, abrimos incidencia y reintentamos.</p>
        <form action="/soporte" className="mt-8 flex max-w-2xl gap-3">
          <input className="input min-h-14" name="q" placeholder="Buscar en soporte" />
          <button className="btn" type="submit"><Search size={17} /> Buscar</button>
        </form>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {faqs.map(([title, copy]) => <article className="hub-mini-card" key={title}><LifeBuoy size={22} className="text-cyan-300" /><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
        <div className="surface mt-10 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-display text-2xl font-black">Necesitas ayuda directa?</h2><p className="mt-1 text-sm text-slate-400">Abre un ticket y lo revisamos desde el panel de soporte.</p></div>
          <Link className="btn btn-primary" href="/contacto">Abrir un ticket</Link>
        </div>
      </section>
    </PublicShell>
  );
}
