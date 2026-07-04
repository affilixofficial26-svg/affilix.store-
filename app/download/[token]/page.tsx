import { HonestEmptyState, PublicShell } from "@/components/digital-hub/PublicShell";

export default async function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  await params;
  return (
    <PublicShell>
      <section className="mx-auto max-w-3xl px-4 py-24">
        <HonestEmptyState title="Descarga no disponible" message="El enlace no existe, ha caducado o todavía no se ha confirmado la entrega. AFFILIX no expone archivos sin un token válido." />
      </section>
    </PublicShell>
  );
}

