"use client";

import { useMemo, useState } from "react";

type SearchSuggestion = {
  label: string;
  type: "Producto" | "Categoria" | "Proveedor";
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function PublicSearchBox({
  initialQuery,
  suggestions,
}: {
  initialQuery?: string;
  suggestions: SearchSuggestion[];
}) {
  const [query, setQuery] = useState(initialQuery || "");
  const normalizedQuery = normalizeSearchText(query);
  const filtered = useMemo(() => {
    if (normalizedQuery.length < 2) return [];
    return suggestions
      .filter((item) => normalizeSearchText(item.label).includes(normalizedQuery))
      .slice(0, 8);
  }, [normalizedQuery, suggestions]);

  return (
    <form action="/productos" className="relative flex min-w-0 flex-1 overflow-visible rounded-md bg-white">
      <input
        autoComplete="off"
        className="min-h-12 min-w-0 flex-1 rounded-l-md px-4 text-base text-slate-950 outline-none"
        name="q"
        placeholder="Buscar productos, marcas y ofertas"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button className="min-h-12 rounded-r-md bg-[#00aeef] px-5 text-sm font-extrabold text-white transition hover:bg-[#008fd0]" type="submit">Buscar</button>

      {filtered.length ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-2xl">
          {filtered.map((item) => (
            <button
              key={`${item.type}-${item.label}`}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-sky-50"
              name="q"
              type="submit"
              value={item.label}
            >
              <span className="line-clamp-1 font-bold">{item.label}</span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500">{item.type}</span>
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
