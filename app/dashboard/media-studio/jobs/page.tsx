import { getAdminDb } from "@/lib/supabase";
import { money } from "@/lib/utils";

type MuapiJobRow = {
  id: string;
  endpoint: string;
  model: string;
  category: string;
  origin: string;
  status: string;
  cost_usd: number | string | null;
  created_at: string;
  finished_at: string | null;
};

async function getJobs() {
  try {
    return await getAdminDb().select<MuapiJobRow>("muapi_jobs", {
      select: "id,endpoint,model,category,origin,status,cost_usd,created_at,finished_at",
      order: "created_at.desc",
      limit: "50",
    });
  } catch {
    return [];
  }
}

export default async function MediaStudioJobsPage() {
  const jobs = await getJobs();

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-gold)]">Historial MuAPI</div>
        <h1 className="mt-2 font-display text-3xl font-bold">Jobs de Media Studio</h1>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Coste</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length ? jobs.map((job) => (
              <tr key={job.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-bold">{job.category}</td>
                <td className="px-4 py-3 font-mono text-xs">{job.model || job.endpoint}</td>
                <td className="px-4 py-3">{job.origin}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold">{job.status}</span>
                </td>
                <td className="px-4 py-3">{money(Number(job.cost_usd || 0), "USD")}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{new Date(job.created_at).toLocaleString("es-ES")}</td>
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-8 text-center text-[var(--text-secondary)]" colSpan={6}>
                  Todavia no hay jobs de MuAPI registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
