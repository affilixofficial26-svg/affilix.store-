"use client";

import { useState } from "react";

export function BudgetPicker({ budget }: { budget: number }) {
  const [selectedBudget, setSelectedBudget] = useState(budget);

  return (
    <>
      <div className="mt-4 font-mono text-4xl">EUR {selectedBudget.toLocaleString("es-ES")}<span className="text-base text-[var(--text-secondary)]"> / mes</span></div>
      <input type="hidden" name="monthly_budget" value={selectedBudget} />
      <div className="grid grid-cols-4 gap-2">
        {[20, 50, 100, 200].map((value) => (
          <button
            key={value}
            className={`btn ${selectedBudget === value ? "btn-primary" : ""}`}
            type="button"
            onClick={() => setSelectedBudget(value)}
          >
            EUR {value}
          </button>
        ))}
      </div>
      <input
        className="input"
        name="monthly_budget_manual"
        type="number"
        min="1"
        step="1"
        value={selectedBudget}
        onChange={(event) => setSelectedBudget(Math.max(1, Number(event.target.value || 1)))}
      />
    </>
  );
}
