import { EmptyState } from "@/components/ui/EmptyState";
import Image from "next/image";
import { getAdminDb } from "@/lib/supabase";
import type { AffiliateProduct } from "@/types";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ image?: string; message?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  let product: AffiliateProduct | undefined;
  try {
    product = (await getAdminDb().select<AffiliateProduct>("affiliate_products", { select: "*", id: `eq.${id}`, limit: "1" }))[0];
  } catch {}
  if (!product) return <EmptyState title="Producto no encontrado" message="No existe un producto con ese ID o Supabase no esta configurado." />;
  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <div className="surface overflow-hidden">{product.image_url ? <Image src={product.image_url} alt={product.title} width={760} height={760} className="w-full" /> : <div className="aspect-square" />}</div>
      <div className="surface p-6">
        {query.image ? (
          <div className={`mb-4 rounded-lg border border-[var(--border)] p-3 text-sm ${query.image === "ok" ? "text-emerald-300" : "text-[var(--accent-gold)]"}`}>
            {query.image === "ok" ? "Foto actualizada correctamente." : `No se pudo actualizar la foto: ${query.message || "revisa la URL o la API de imagen."}`}
          </div>
        ) : null}
        <div className="font-mono text-sm text-[var(--accent-gold)]">{product.platform}</div>
        <h1 className="font-display mt-2 text-3xl font-bold">{product.ai_title || product.title}</h1>
        <div className={`mt-4 rounded-lg border p-3 text-sm ${product.is_active && product.image_url ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-[rgba(245,166,35,.35)] bg-[var(--accent-gold-glow)] text-[var(--accent-gold)]"}`}>
          {product.is_active && product.image_url
            ? "Producto visible en la tienda publica con foto real cargada."
            : "Necesita foto: este producto no sale en la tienda publica hasta subir la foto real del proveedor."}
        </div>
        <p className="mt-4 text-[var(--text-secondary)]">{product.ai_description || product.description}</p>
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <h2 className="font-display text-lg font-bold">Enlace exacto del proveedor</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Abre este enlace, descarga la foto exacta del producto y subela abajo.</p>
          <a className="btn mt-4 w-full" href={product.affiliate_url} target="_blank" rel="noreferrer">Abrir producto del proveedor</a>
          <div className="mt-3 break-all rounded-lg bg-[var(--bg-input)] p-3 font-mono text-xs text-[var(--text-secondary)]">{product.affiliate_url}</div>
        </div>
        <form action="/api/ai/generate-content" method="post" className="mt-6">
          <input type="hidden" name="product_id" value={product.id} />
          <button className="btn btn-primary" data-help="Regenera titulo, descripcion, review y SEO." type="submit">Regenerar contenido IA</button>
        </form>
        <form action="/api/products/image" method="post" encType="multipart/form-data" className="mt-6 space-y-3 border-t border-[var(--border)] pt-5">
          <input type="hidden" name="product_id" value={product.id} />
          <label className="space-y-2">
            <span className="text-sm font-bold">URL de la foto real del proveedor</span>
            <input className="input" name="image_url" type="url" placeholder="https://..." defaultValue={product.image_source === "supplier" ? product.image_url || "" : ""} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold">Subir foto real desde el ordenador</span>
            <input className="input" name="image_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
          </label>
          <button className="btn" type="submit">Guardar foto y publicar en tienda</button>
        </form>
      </div>
    </div>
  );
}
