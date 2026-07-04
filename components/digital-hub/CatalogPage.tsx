import { CatalogCard } from "@/components/digital-hub/CatalogCard";
import { HonestEmptyState, PageIntro, PublicShell } from "@/components/digital-hub/PublicShell";
import type { DigitalCatalogItem } from "@/lib/digital-hub";

export function CatalogPage({
  eyebrow,
  title,
  description,
  items,
  emptyTitle,
  emptyMessage,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: DigitalCatalogItem[];
  emptyTitle: string;
  emptyMessage: string;
}) {
  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean))) as string[];
  return (
    <PublicShell>
      <PageIntro eyebrow={eyebrow} title={title} description={description} />
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        {categories.length ? (
          <div className="mb-8 flex flex-wrap gap-2">
            <span className="border border-[#38bdf8] bg-[#38bdf8]/10 px-3 py-2 text-xs font-black text-[#7dd3fc]">Todos</span>
            {categories.map((category) => <span key={category} className="border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">{category}</span>)}
          </div>
        ) : null}
        {items.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <CatalogCard key={item.id} item={item} />)}</div>
        ) : (
          <HonestEmptyState title={emptyTitle} message={emptyMessage} />
        )}
      </section>
    </PublicShell>
  );
}

