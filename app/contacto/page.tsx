import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { PublicShell } from "@/components/digital-hub/PublicShell";

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[1fr_.8fr] lg:px-6">
        <div>
          <p className="hub-eyebrow">Contacto</p>
          <h1 className="mt-3 font-display text-5xl font-black text-white">Habla con AFFILIX.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Cuentanos que necesitas: soporte, colaboracion, producto digital, servicio creativo o programa de afiliados.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="hub-benefit"><Mail size={18} /> hola@affilix.es</div>
            <div className="hub-benefit"><Mail size={18} /> soporte@affilix.es</div>
          </div>
        </div>
        <form action="/api/public/support-ticket" method="post" className="surface space-y-4 p-6">
          <input type="hidden" name="source" value="contacto" />
          <label className="block space-y-2"><span className="text-sm font-bold">Nombre</span><input className="input" name="name" required /></label>
          <label className="block space-y-2"><span className="text-sm font-bold">Email</span><input className="input" name="email" type="email" required /></label>
          <label className="block space-y-2"><span className="text-sm font-bold">Asunto</span><input className="input" name="subject" required /></label>
          <label className="block space-y-2"><span className="text-sm font-bold">Mensaje</span><textarea className="input min-h-32 py-3" name="message" required /></label>
          <button className="btn btn-primary w-full" type="submit"><Send size={16} /> Enviar mensaje</button>
          <p className="text-xs leading-5 text-slate-500">Antes de escribir, revisa tambien <Link className="text-cyan-300" href="/soporte">soporte</Link>.</p>
        </form>
      </section>
    </PublicShell>
  );
}
