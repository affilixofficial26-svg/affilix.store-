export function RevenueChart({ title, data }: { title: string; data: Array<{ date: string; value: number }> }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="surface fade-up p-5" data-help={`Grafico de ${title}. Sirve para ver la evolucion diaria y detectar subidas o bajadas.`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="font-display text-lg font-bold">{title}</div>
        <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-emerald-200">
          7 dias
        </div>
      </div>
      <div className="flex h-48 items-end gap-2 rounded-2xl border border-white/[.06] bg-black/20 p-4">
        {data.map((item) => (
          <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-[150px] w-full items-end rounded-t-xl bg-white/[.035]">
              <div
                className="w-full rounded-t-xl bg-[linear-gradient(180deg,var(--accent-gold),var(--accent-amber),rgba(46,229,157,.62))] shadow-[0_0_22px_rgba(245,184,65,.16)]"
                style={{ height: `${Math.max(8, (item.value / max) * 150)}px` }}
              />
            </div>
            <span className="truncate text-[10px] text-[var(--text-muted)]">{item.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
