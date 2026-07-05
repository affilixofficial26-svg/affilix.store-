import Link from "next/link";
import { CreditCard } from "lucide-react";
import { PublicShell } from "@/components/digital-hub/PublicShell";

const plans = [
  ["Pago unico", "Por producto", "Compra suelta, licencia segun producto y entrega automatica."],
  ["Creditos creativos", "Desde 15 EUR", "100, 500 o 2.000 creditos para servicios y producciones digitales. Validez 12 meses."],
  ["Plan Pro", "19 EUR/mes", "10 servicios/mes, 500 creditos, prioridad en cola."],
  ["Plan Business", "79 EUR/mes", "50 servicios/mes, 3.000 creditos, revision humana en 24h."],
  ["Afiliado", "Gratis", "Escaparate propio, materiales y comisiones desde 30%."],
];

export default function PlansPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <p className="hub-eyebrow">Planes</p>
        <h1 className="mt-3 font-display text-5xl font-black text-white">Elige como usar AFFILIX.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Compra una vez, usa creditos creativos, entra como afiliado o activa un plan mensual.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-5">
          {plans.map(([name, price, copy]) => (
            <article className="hub-plan" key={name}>
              <CreditCard size={22} className="text-cyan-300"/>
              <h3 className="mt-4">{name}</h3>
              <p className="text-cyan-200">{price}</p>
              <p>{copy}</p>
              <Link className="btn mt-4 w-full" href={name === "Afiliado" ? "/afiliados" : "/productos-digitales"}>Empezar</Link>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
