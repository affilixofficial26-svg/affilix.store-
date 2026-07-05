import { CheckCircle2, CircleAlert, CircleDot } from "lucide-react";
import { getPayPalEnvironment, isPayPalConfigured } from "@/lib/paypal";

const integrations = [
  {
    name: "Supabase",
    description: "Base de datos, almacenamiento y entregas.",
    ready: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    detail: "Producción",
  },
  {
    name: "Stripe",
    description: "Pagos con tarjeta y confirmación mediante webhook.",
    ready: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    detail: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "Producción" : "Modo test",
  },
  {
    name: "PayPal",
    description: "Checkout PayPal Orders v2 y webhook firmado.",
    ready: isPayPalConfigured() && Boolean(process.env.PAYPAL_WEBHOOK_ID),
    detail: getPayPalEnvironment() === "live" ? "Producción" : "Sandbox — no visible al público",
  },
  {
    name: "Correo",
    description: "Recibos, entregas y seguimiento.",
    ready: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
    detail: "Servidor",
  },
  {
    name: "Muapi",
    description: "Texto, imagen, vídeo y ejecución de servicios.",
    ready: Boolean(process.env.MUAPI_API_KEY),
    detail: "API conectada",
  },
];

export const dynamic = "force-dynamic";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[.16em] text-[var(--accent-cyan)]">Estado real</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Integraciones</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Servicios conectados y entorno operativo. Las credenciales nunca se muestran.</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        {integrations.map((integration) => (
          <section key={integration.name} className="surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">{integration.name}</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{integration.description}</p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${
                integration.ready
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-200"
              }`}>
                {integration.ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
                {integration.ready ? "Conectado" : "Pendiente"}
              </span>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-[var(--text-muted)]">
              <CircleDot className="h-4 w-4" />
              {integration.detail}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
