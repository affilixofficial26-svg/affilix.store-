"use client";

import { useEffect, useState } from "react";
import type { AffiliateProduct } from "@/types";

export function useProducts() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/stats")
      .then(() => fetch("/store"))
      .then(() => setProducts([]))
      .catch((err) => setError(err instanceof Error ? err.message : "Error cargando productos"))
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}
