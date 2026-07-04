import type { DashboardStats } from "@/types";

export function ActivityFeed({ rows }: { rows: DashboardStats["recentActivity"] }) {
  return (
    <div className="surface fade-up overflow-hidden" data-help="Feed de actividad reciente: muestra acciones del agente, comisiones y eventos importantes.">
      <div className="border-b border-white/10 p-5 font-display text-lg font-bold">
        <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--accent-green)] shadow-[0_0_18px_rgba(46,229,157,.8)]" />
        Actividad en tiempo real
      </div>
      <div>
        {rows.map((row) => (
          <div key={`${row.created_at}-${row.title}`} className="border-b border-white/[.055] p-4 transition hover:bg-white/[.035]">
            <div className="text-sm font-semibold">{row.title}</div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">{row.detail}</div>
          </div>
        ))}
        {!rows.length ? (
          <div className="p-5 text-sm text-[var(--text-secondary)]">Sin actividad reciente.</div>
        ) : null}
      </div>
    </div>
  );
}
