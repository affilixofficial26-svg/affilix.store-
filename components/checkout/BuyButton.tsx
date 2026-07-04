"use client";

import { useState } from "react";
import { CreditCard, LoaderCircle } from "lucide-react";

export function BuyButton({ itemId }: { itemId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/checkout/create-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ catalog_item_id: itemId, quantity: 1 }) });
      const payload = await response.json() as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "No se pudo iniciar el pago.");
      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "No se pudo iniciar el pago.");
      setLoading(false);
    }
  }
  return <div className="mt-7"><button className="btn btn-primary min-h-12 px-6" type="button" disabled={loading} onClick={startCheckout}>{loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}{loading ? "Abriendo pago seguro…" : "Comprar ahora"}</button>{error ? <p className="mt-3 text-sm font-bold text-red-300" role="alert">{error}</p> : null}</div>;
}
