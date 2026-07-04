import Link from "next/link";
import { PublicShell } from "@/components/digital-hub/PublicShell";

export default function CheckoutSuccessPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-3xl px-4 py-24">
        <div className="border border-emerald-400/30 bg-emerald-400/10 p-8">
          <h1 className="font-display text-4xl font-black text-white">Gracias por tu compra.</h1>
          <p className="mt-4 leading-7 text-slate-300">El sistema está comprobando el estado del pedido. La entrega solo se habilitará después de recibir una confirmación de pago válida.</p>
          <Link href="/" className="mt-7 inline-flex rounded-md bg-white px-5 py-3 text-sm font-black text-[#080a10]">Volver a AFFILIX</Link>
        </div>
      </section>
    </PublicShell>
  );
}

