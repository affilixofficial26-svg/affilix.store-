import { money } from "@/lib/utils";
import type { DashboardStats } from "@/types";

export function TopProductsTable({ rows }: { rows: DashboardStats["topProducts"] }) {
  return (
    <div className="surface fade-up overflow-hidden" data-help="Tabla de productos que más dinero están generando. Úsala para priorizar promoción y contenido.">
      <div className="border-b border-[var(--border)] p-5 font-display text-lg font-bold">Top productos por comisión</div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[rgba(255,255,255,.025)] text-left text-xs uppercase tracking-[.1em] text-[var(--text-muted)]">
            <tr>
              <th className="p-4">Producto</th>
              <th className="p-4">Plataforma</th>
              <th className="p-4">Clicks</th>
              <th className="p-4">Comisión</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.slug}-${row.platform}`} className="border-t border-[var(--border)] hover:bg-[var(--bg-elevated)]">
                <td className="p-4 font-semibold">{row.title}</td>
                <td className="p-4 font-mono text-[var(--accent-gold)]">{row.platform}</td>
                <td className="p-4 font-mono">{row.clicks}</td>
                <td className="p-4 font-mono text-[var(--accent-green)]">{money(row.commission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
