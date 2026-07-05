"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import { useState, type ReactNode } from "react";

const navigation = [
  ["Productos Digitales", "/productos-digitales"],
  ["Servicios Creativos", "/servicios-ia"],
  ["Kits de Negocio", "/kits-negocio"],
  ["Herramientas", "/herramientas-ia"],
  ["Comparador", "/comparador"],
  ["Recursos", "/recursos"],
  ["Planes", "/planes"],
  ["Afiliados", "/afiliados"],
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="hub-header">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-5 px-4 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="AFFILIX">
          <Image src="/brand/logo/affilix-logo-approved.png" alt="AFFILIX" width={178} height={45} className="h-10 w-auto object-contain" priority />
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {navigation.map(([label, href]) => <Link key={href} href={href} className="hub-nav-link">{label}</Link>)}
        </nav>
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <Link href="/login" className="hub-nav-link">Iniciar sesion</Link>
          <Link href="/servicios-ia" className="btn btn-primary"><Sparkles size={16} /> Crear proyecto</Link>
        </div>
        <button className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 lg:hidden" onClick={() => setOpen(!open)} aria-label="Abrir menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <nav className="hub-mobile-menu">
          {navigation.map(([label, href]) => <Link onClick={() => setOpen(false)} key={href} href={href}>{label}</Link>)}
          <Link href="/login">Iniciar sesion</Link>
          <Link className="btn btn-primary" href="/servicios-ia">Crear proyecto</Link>
        </nav>
      ) : null}
    </header>
  );
}

const groups = [
  ["Producto", [["Productos Digitales", "/productos-digitales"], ["Servicios Creativos", "/servicios-ia"], ["Kits de Negocio", "/kits-negocio"], ["Herramientas", "/herramientas-ia"], ["Comparador", "/comparador"]]],
  ["Comunidad", [["Afiliados", "/afiliados"], ["Recursos", "/recursos"], ["Soporte", "/soporte"]]],
  ["Legal", [["Terminos", "/legal/terminos"], ["Privacidad", "/legal/privacidad"], ["Cookies", "/legal/cookies"], ["Reembolsos", "/legal/reembolsos"], ["Licencias", "/legal/licencias"], ["Contacto", "/contacto"]]],
] as const;

export function PublicFooter() {
  return (
    <footer className="hub-footer">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-6">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/brand/logo/affilix-logo-approved.png" alt="AFFILIX" width={220} height={55} className="h-12 w-auto object-contain" />
          </div>
          <p className="mt-4 text-lg font-black text-white">Crea. Vende. Automatiza.</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">Productos digitales, servicios creativos, kits y herramientas para impulsar tu negocio.</p>
        </div>
        {groups.map(([title, links]) => (
          <div key={title}>
            <h2 className="text-sm font-black text-white">{title}</h2>
            <div className="mt-4 space-y-3">
              {links.map(([label, href]) => <Link className="block text-sm text-slate-400 hover:text-white" key={label} href={href}>{label}</Link>)}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-600">© {new Date().getFullYear()} AFFILIX. Todos los derechos reservados.</div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#070A12] text-white"><PublicHeader /><main>{children}</main><PublicFooter /></div>;
}

export function PageIntro({ title, description, eyebrow }: { title: string; description: string; eyebrow?: string }) {
  return (
    <section className="border-b border-white/10 bg-[#0d111a]">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        {eyebrow ? <p className="hub-eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-3 max-w-4xl font-display text-4xl font-black sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{description}</p>
      </div>
    </section>
  );
}

export function HonestEmptyState({ title, message }: { title: string; message: string }) {
  return <div className="hub-empty"><h2 className="font-display text-2xl font-black">{title}</h2><p>{message}</p></div>;
}
