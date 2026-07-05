"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppWindow,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  DownloadCloud,
  Images,
  ClipboardCheck,
  FileArchive,
  GitCompareArrows,
  Handshake,
  LayoutDashboard,
  LibraryBig,
  Megaphone,
  Radar,
  ReceiptText,
  ScrollText,
  Settings,
  WalletCards,
  WandSparkles,
  Workflow,
} from "lucide-react";
import { AffilixLogo } from "@/components/brand/AffilixLogo";

const sections = [
  {
    label: "Control",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, help: "Vista general del negocio digital." },
      { label: "Analitica", href: "/dashboard/analytics", icon: BarChart3, help: "Ingresos, clics, conversiones y rendimiento." },
      { label: "Finanzas", href: "/dashboard/finance", icon: WalletCards, help: "Ingresos, pagos, comisiones y costes." },
    ],
  },
  {
    label: "Ventas Digitales",
    items: [
      { label: "Catalogo Digital", href: "/dashboard/catalog", icon: LibraryBig, help: "Centro principal de items vendibles." },
      { label: "Productos Digitales", href: "/dashboard/digital-products", icon: FileArchive, help: "PDFs, ZIPs, plantillas y recursos descargables." },
      { label: "Servicios IA", href: "/dashboard/ai-services", icon: WandSparkles, help: "Servicios generativos bajo demanda." },
      { label: "Kits de Negocio", href: "/dashboard/business-kits", icon: BriefcaseBusiness, help: "Packs por sector y negocio." },
      { label: "Pedidos", href: "/dashboard/orders", icon: ReceiptText, help: "Compras, pagos y estados." },
      { label: "Entregas", href: "/dashboard/deliveries", icon: DownloadCloud, help: "Descargas, tokens y emails de entrega." },
    ],
  },
  {
    label: "Crecimiento",
    items: [
      { label: "SaaS & Herramientas IA", href: "/dashboard/saas", icon: AppWindow, help: "Herramientas IA y enlaces afiliados." },
      { label: "Comparador Inteligente", href: "/dashboard/comparator", icon: GitCompareArrows, help: "Paginas comparativas y SEO." },
      { label: "Fabrica de Nichos", href: "/dashboard/niche-factory", icon: Radar, help: "Oportunidades, nichos y borradores." },
      { label: "Afiliados", href: "/dashboard/affiliates", icon: Handshake, help: "Partners, tracking y comisiones digitales." },
      { label: "Marketing Automatico", href: "/dashboard/marketing", icon: Megaphone, help: "Campanas, SEO, redes y emails." },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Automatizaciones", href: "/dashboard/automation", icon: Workflow, help: "Cron jobs, tareas y flujos." },
      { label: "Agentes IA", href: "/dashboard/agents", icon: BrainCircuit, help: "Control de agentes, permisos y logs." },
      { label: "Media Studio", href: "/dashboard/media-studio", icon: Images, help: "Generacion multimedia con MuAPI." },
      { label: "Pruebas en Vivo", href: "/dashboard/live-tests", icon: ClipboardCheck, help: "Evidencia real de QA, navegador, integraciones y reportes." },
      { label: "Configuracion", href: "/dashboard/settings", icon: Settings, help: "Marca, pagos, IA, seguridad y webhooks." },
      { label: "Logs del Sistema", href: "/dashboard/logs", icon: ScrollText, help: "Errores, acciones y trazabilidad." },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand border-b border-white/10 p-5">
        <Link href="/dashboard" aria-label="Ir al dashboard AFFILIX">
          <AffilixLogo className="h-14 w-full" />
        </Link>
      </div>
      <nav className="sidebar-nav space-y-5 p-4">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent-gold)]/70">{section.label}</div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-help={item.help}
                    className={`help-below flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "border border-amber-300/30 bg-[linear-gradient(135deg,rgba(245,184,65,.22),rgba(255,138,61,.13),rgba(56,232,255,.10))] text-white shadow-[0_14px_36px_rgba(245,184,65,.12)]"
                        : "border border-transparent text-[var(--text-secondary)] hover:border-white/10 hover:bg-white/[.045] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-amber-300/15 text-[var(--accent-gold)]" : "bg-white/[.045] text-[var(--text-muted)]"}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="sidebar-footer m-4 space-y-3">
        <div className="rounded-2xl border border-amber-300/20 bg-[linear-gradient(145deg,rgba(245,184,65,.12),rgba(46,229,157,.06))] p-4 shadow-[0_16px_38px_rgba(0,0,0,.22)]">
          <div className="flex items-center gap-2 text-sm font-black text-[var(--accent-gold)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-green)]" />
            Digital Hub
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Crea. Vende. Automatiza.</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="logout-button" type="submit" aria-label="Cerrar sesion de AFFILIX">
            <span className="logout-icon" aria-hidden="true">
              <span />
            </span>
            <span>Cerrar sesion</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
