import { ProductCard } from "@/components/products/ProductCard";
import type { AffiliateProduct } from "@/types";

export function ProductGrid({ products }: { products: AffiliateProduct[] }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
