import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

export function DataErrorBoundary({ error, children }: { error?: string | null; children: ReactNode }) {
  if (!error) return children;
  return (
    <section className="rounded-xl border border-red-400/30 bg-red-500/10 p-5 text-red-100" role="alert">
      <div className="flex items-center gap-2 font-black"><AlertTriangle className="h-5 w-5" /> Base de datos desconectada</div>
      <p className="mt-2 text-sm leading-6 text-red-100/80">{error}</p>
    </section>
  );
}
