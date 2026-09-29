"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function SessionNoteForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await fetch("/api/session-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, content }),
    });
    setContent("");
    setLoading(false);
    toast("Nota guardada", "success");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        className="input-field"
        rows={3}
        placeholder="Notas de la sesión de hoy…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button type="submit" disabled={loading} className="btn-primary text-sm">
        {loading ? "Guardando…" : "Agregar nota"}
      </button>
    </form>
  );
}
