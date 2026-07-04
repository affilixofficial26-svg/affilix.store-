export function RunHistoryTable({ rows = [] }: { rows?: Array<{ action: string; status: string }> }) {
  return (
    <div data-help="Historial de ejecuciones automáticas. Úsalo para revisar qué procesos corrieron y su estado.">
      {rows.map((row) => <div key={`${row.action}-${row.status}`} className="border-b border-[var(--border)] p-3">{row.action} · {row.status}</div>)}
    </div>
  );
}
