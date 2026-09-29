"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function FinanceEntryForm() {
  const router = useRouter();
  const toast = useToast();
  const [kind, setKind] = useState<"ingreso" | "gasto">("ingreso");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!concept || !amount) return;
    setLoading(true);
    await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, concept, amount: Number(amount) }),
    });
    setConcept("");
    setAmount("");
    setLoading(false);
    toast(kind === "ingreso" ? "Ingreso registrado" : "Gasto registrado", "success");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="field-label">Tipo</label>
        <select className="input-field" value={kind} onChange={(e) => setKind(e.target.value as any)}>
          <option value="ingreso">Ingreso</option>
          <option value="gasto">Gasto</option>
        </select>
      </div>
      <div>
        <label className="field-label">Concepto</label>
        <input className="input-field" value={concept} onChange={(e) => setConcept(e.target.value)} />
      </div>
      <div>
        <label className="field-label">Monto</label>
        <input
          type="number"
          min="0"
          className="input-field"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Guardando…" : "Registrar"}
      </button>
    </form>
  );
}
