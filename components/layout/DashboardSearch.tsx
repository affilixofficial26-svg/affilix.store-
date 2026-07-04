"use client";

import { useEffect, useRef, useState } from "react";

type SearchResult = {
  label: string;
  description: string;
  href: string;
  type: string;
};

export function DashboardSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/search?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const json = (await res.json()) as { results?: SearchResult[] };
        setResults(json.results || []);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (results[0]?.href) window.location.href = results[0].href;
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submitSearch}>
        <input
          className="input help-below w-full"
          data-help="Escribe para encontrar productos, afiliados, comisiones, logs o secciones del panel."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Buscar productos, afiliados, comisiones, logs..."
          autoComplete="off"
        />
      </form>

      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-amber-200/20 bg-[rgba(10,14,20,.98)] text-[var(--text-primary)] shadow-[0_24px_70px_rgba(0,0,0,.72)] backdrop-blur-2xl">
          <div className="border-b border-white/10 bg-white/[.035] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--accent-gold)]">
            {loading ? "Buscando..." : `${results.length} resultado${results.length === 1 ? "" : "s"}`}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {results.map((item) => (
              <a
                key={`${item.type}-${item.href}-${item.label}`}
                href={item.href}
                className="block border-b border-white/[.07] bg-transparent px-4 py-3 transition hover:bg-white/[.055]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{item.label}</span>
                  <span className="shrink-0 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    {item.type}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{item.description}</p>
              </a>
            ))}
            {!loading && !results.length ? (
              <div className="px-4 py-5 text-sm text-[var(--text-secondary)]">
                No hay coincidencias. Prueba con producto, proveedor, afiliado, venta, Meta o log.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
