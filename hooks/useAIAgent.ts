"use client";

import { useState } from "react";

export function useAIAgent() {
  const [running, setRunning] = useState(false);
  async function run(action: "run_full_cycle" | "discover_products" | "update_prices" | "generate_content") {
    setRunning(true);
    try {
      const res = await fetch("/api/ai/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      return await res.json();
    } finally {
      setRunning(false);
    }
  }
  return { running, run };
}
