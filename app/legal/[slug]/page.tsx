import { notFound } from "next/navigation";
import { PublicShell } from "@/components/digital-hub/PublicShell";
import { getAdminDb } from "@/lib/supabase";

type LegalDocument = {
  slug: string;
  title: string;
  version: string;
  content_md: string;
  published_at: string | null;
};

export const dynamic = "force-dynamic";

async function getLegal(slug: string) {
  try {
    const rows = await getAdminDb().select<LegalDocument>("legal_documents", {
      select: "slug,title,version,content_md,published_at",
      slug: `eq.${slug}`,
      published: "eq.true",
      order: "published_at.desc",
      limit: "1",
    });
    return rows[0] || null;
  } catch {
    return null;
  }
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const document = await getLegal((await params).slug);
  if (!document) notFound();

  return (
    <PublicShell>
      <section className="mx-auto max-w-4xl px-4 py-16 lg:px-6">
        <p className="hub-eyebrow">Legal</p>
        <h1 className="mt-3 font-display text-4xl font-black text-white">{document.title}</h1>
        <time className="mt-4 block text-sm text-slate-500" dateTime={document.published_at || ""}>
          Version {document.version} · Ultima actualizacion: {document.published_at ? new Date(document.published_at).toLocaleDateString("es-ES") : "pendiente"}
        </time>
        <article className="surface mt-8 space-y-4 p-7 text-sm leading-7 text-slate-300">
          {document.content_md.split("\n").filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </article>
      </section>
    </PublicShell>
  );
}
