export function AgentStatus({ status = "idle" }: { status?: "idle" | "running" | "error" }) {
  return <div className="rounded-full bg-[var(--accent-gold-glow)] px-3 py-1 text-xs font-bold text-[var(--accent-gold)]" data-help="Estado actual del agente: idle en espera, running trabajando, error si falló.">{status}</div>;
}
