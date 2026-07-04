import { DashboardSearch } from "@/components/layout/DashboardSearch";

export function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center gap-3 border-b border-white/10 bg-[rgba(5,6,9,.76)] px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,.24)] backdrop-blur-2xl sm:flex-nowrap sm:px-6">
      <div className="help-below shrink-0 text-sm font-semibold text-[var(--text-secondary)]" data-help="Indica que estas dentro del panel privado de AFFILIX.">
        AFFILIX <span className="mx-2 text-[var(--accent-gold)]">/</span> <span className="text-[var(--text-primary)]">Panel</span>
      </div>
      <div className="w-full sm:ml-auto sm:max-w-md">
        <DashboardSearch />
      </div>
      <div className="help-below hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200/30 bg-[linear-gradient(135deg,var(--accent-gold),var(--accent-amber))] text-sm font-black text-black shadow-[0_12px_30px_rgba(245,184,65,.22)] sm:flex" data-help="Perfil administrador de YANKYFILMS.">YF</div>
    </header>
  );
}
