import Link from "next/link";
import Image from "next/image";
import { CopyPublicLinkButton } from "@/components/products/CopyPublicLinkButton";
import { getPublicProductUrl } from "@/lib/store-links";
import { money } from "@/lib/utils";
import type { AffiliateProduct } from "@/types";

export function ProductCard({ product }: { product: AffiliateProduct }) {
  const publicUrl = getPublicProductUrl(product);
  const publicReady = Boolean(product.is_active && product.image_url);

  return (
    <article className="surface overflow-hidden" data-help={`Producto afiliado: ${product.title}. Abre su ficha para ver precio, review y enlace con tracking.`}>
      <div className="aspect-[16/10] bg-[var(--bg-elevated)]">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.title} width={640} height={480} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold text-[var(--text-muted)]">
            Foto pendiente: abre el producto del proveedor y sube la foto real
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="font-mono text-xs uppercase text-[var(--accent-gold)]">{product.platform}</div>
        <div className={`mt-2 rounded-full px-2.5 py-1 text-center text-xs font-bold ${publicReady ? "bg-emerald-500/15 text-emerald-300" : "bg-[var(--accent-gold-glow)] text-[var(--accent-gold)]"}`}>
          {publicReady ? "Visible en tienda" : "Necesita foto"}
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-10 font-display text-base font-bold">{product.ai_title || product.title}</h3>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="font-mono text-lg text-[var(--accent-green)]">{money(product.price, product.currency)}</div>
          <div className="text-xs text-[var(--text-secondary)]">{product.rating ? `${product.rating}/5` : "Sin rating"}</div>
        </div>
        <Link className="btn btn-primary mt-3 w-full" data-help="Abre la ficha interna del producto para ver proveedor, foto y publicacion." href={`/dashboard/products/${product.id}`}>
          Abrir ficha
        </Link>
        {publicReady ? (
          <>
            <a className="btn mt-3 w-full" href={publicUrl} target="_blank" rel="noreferrer">
              Abrir enlace publico
            </a>
            <div className="mt-3">
              <CopyPublicLinkButton url={publicUrl} />
            </div>
          </>
        ) : (
          <a className="btn mt-3 w-full" href={product.affiliate_url} target="_blank" rel="noreferrer">
            Abrir proveedor
          </a>
        )}
        <form action="/api/products/image" method="post" encType="multipart/form-data" className="mt-3 space-y-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="redirect_to" value="/dashboard/products" />
          <label className="block text-xs font-bold text-[var(--text-secondary)]" htmlFor={`image_file_${product.id}`}>
            {product.image_url ? "Cambiar foto publica" : "Subir foto y publicar"}
          </label>
          <input id={`image_file_${product.id}`} className="input text-xs" name="image_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
          <button className="btn w-full" type="submit">
            Guardar foto
          </button>
        </form>
        <form action="/api/products/fetch-provider-image" method="post" className="mt-3">
          <input type="hidden" name="product_id" value={product.id} />
          <button className="btn w-full" type="submit">
            Buscar foto del proveedor
          </button>
        </form>
        {product.image_url && !product.is_active ? (
          <form action="/api/products/publish" method="post" className="mt-3">
            <input type="hidden" name="product_id" value={product.id} />
            <button className="btn btn-primary w-full" type="submit">
              Publicar en web
            </button>
          </form>
        ) : null}
        <form action="/api/products/sell" method="post" className="mt-3">
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="target_platform" value="amazon_seller" />
          <button className="btn w-full" data-help="Activa el producto para venta automatizada. Si falta Amazon Seller Central, te manda a conectarlo primero." type="submit">
            Vender automaticamente
          </button>
        </form>
      </div>
    </article>
  );
}
