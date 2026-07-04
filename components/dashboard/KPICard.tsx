import { money } from "@/lib/utils";

export function KPICard({
  label,
  value,
  kind = "number",
  accent = "var(--accent-gold)",
}: {
  label: string;
  value: number;
  kind?: "money" | "percent" | "number";
  accent?: string;
}) {
  const display =
    kind === "money"
      ? money(value)
      : kind === "percent"
        ? `${value.toFixed(2)}%`
        : new Intl.NumberFormat("es-ES").format(value);

  return (
    <div
      className="surface fade-up p-5 transition hover:-translate-y-0.5 hover:border-amber-200/25"
      data-help={`Metrica clave: ${label}. Resume el rendimiento principal del sistema.`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-black uppercase tracking-[.12em] text-[var(--text-secondary)]">{label}</div>
        <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_20px_currentColor]" style={{ color: accent, backgroundColor: accent }} />
      </div>
      <div className="font-mono mt-4 text-3xl font-semibold" style={{ color: accent }}>
        {display}
      </div>
      <div className="mt-4 h-9 overflow-hidden rounded-xl border border-white/[.06] bg-black/20">
        <div className="h-full w-2/3 rounded-xl bg-[linear-gradient(90deg,rgba(245,184,65,.36),rgba(46,229,157,.16),rgba(56,232,255,.10))]" />
      </div>
    </div>
  );
}
