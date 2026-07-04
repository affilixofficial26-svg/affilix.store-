import Link from "next/link";
import { PublicShell } from "@/components/digital-hub/PublicShell";

export default function CheckoutCancelPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-3xl px-4 py-24">
        <div className="border border-white/10 bg-[#10141e] p-8">
          <h1 className="font-display text-4xl font-black text-white">El pago no se completó.</h1>
          <p className="mt-4 leading-7 text-slate-300">No se ha activado ninguna entrega. Puedes volver al catálogo y revisar la opción que estabas consultando.</p>
          <Link href="/productos-digitales" className="mt-7 inline-flex rounded-md bg-[#38bdf8] px-5 py-3 text-sm font-black text-[#04111b]">Volver al catálogo</Link>
        </div>
      </section>
    </PublicShell>
  );
}

