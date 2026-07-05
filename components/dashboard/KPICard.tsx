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
      className="surface fade-up min-h-24 p-4 transition hover:border-white/15"
      data-help={`Metrica clave: ${label}. Resume el rendimiento principal del sistema.`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-black uppercase tracking-[.12em] text-[var(--text-secondary)]">{label}</div>
        <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_20px_currentColor]" style={{ color: accent, backgroundColor: accent }} />
      </div>
      <div className="font-mono mt-3 text-2xl font-semibold" style={{ color: accent }}>
        {display}
      </div>
    </div>
  );
}
