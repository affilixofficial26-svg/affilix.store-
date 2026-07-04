import { getAdminDb } from "@/lib/supabase";
import { money } from "@/lib/utils";

type CommissionRow = {
  id: string;
  platform: string;
  commission_amount: number | string | null;
  status: string;
};

export default async function CommissionsPage() {
  let rows: CommissionRow[] = [];
  try { rows = await getAdminDb().select<CommissionRow>("commissions", { select: "*", order: "earned_at.desc", limit: "100" }); } catch {}
  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <h1 className="font-display text-3xl font-bold">Comisiones</h1>
        <a className="btn" href="/api/analytics/commission?format=csv">Exportar CSV</a>
      </div>
      {rows.map((row) => <div key={row.id} className="border-t border-[var(--border)] p-4 font-mono text-sm">{row.platform} · {money(Number(row.commission_amount || 0))} · {row.status}</div>)}
    </div>
  );
}
