"use client";

import { useState } from "react";

export function useAutomation() {
  const [running, setRunning] = useState(false);
  async function run(automation_id: string) {
    setRunning(true);
    try {
      const res = await fetch("/api/automation/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ automation_id }) });
      return await res.json();
    } finally {
      setRunning(false);
    }
  }
  return { running, run };
}
