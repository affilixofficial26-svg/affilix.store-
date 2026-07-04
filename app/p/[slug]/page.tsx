import { ItemDetailPage } from "@/components/digital-hub/ItemDetailPage";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ItemDetailPage slug={(await params).slug} expectedType="product" />;
}

