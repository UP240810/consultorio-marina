"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Patient } from "@/types";
import { useToast } from "@/components/Toast";

export default function PatientForm({ patient }: { patient?: Patient }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    full_name: patient?.full_name || "",
    birth_date: patient?.birth_date || "",
    occupation: patient?.occupation || "",
    phone: patient?.phone || "",
    email: patient?.email || "",
    emergency_contact_name: patient?.emergency_contact_name || "",
    emergency_contact_phone: patient?.emergency_contact_phone || "",
    current_medication: patient?.current_medication || "",
    intake_notes: patient?.intake_notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const url = patient ? `/api/patients/${patient.id}` : "/api/patients";
    const method = patient ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Ocurrió un error al guardar.");
      return;
    }
    const data = await res.json();
    toast(patient ? "Cambios guardados" : "Paciente registrado", "success");
    router.push(`/dashboard/pacientes/${patient?.id || data.patient.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-2xl">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="field-label">Nombre completo *</label>
          <input
            className="input-field"
            required
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Fecha de nacimiento</label>
          <input
            type="date"
            className="input-field"
            value={form.birth_date}
            onChange={(e) => update("birth_date", e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Ocupación</label>
          <input
            className="input-field"
            value={form.occupation}
            onChange={(e) => update("occupation", e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Número de contacto *</label>
          <input
            className="input-field"
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Correo (para recordatorios de cita)</label>
          <input
            type="email"
            className="input-field"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Medicación actual</label>
          <input
            className="input-field"
            value={form.current_medication}
            onChange={(e) => update("current_medication", e.target.value)}
            placeholder="Ninguna, o detalle"
          />
        </div>
        <div>
          <label className="field-label">Contacto de emergencia *</label>
          <input
            className="input-field"
            required
            value={form.emergency_contact_name}
            onChange={(e) => update("emergency_contact_name", e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Teléfono de emergencia *</label>
          <input
            className="input-field"
            required
            value={form.emergency_contact_phone}
            onChange={(e) => update("emergency_contact_phone", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Notas de admisión</label>
          <textarea
            className="input-field"
            rows={3}
            value={form.intake_notes}
            onChange={(e) => update("intake_notes", e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-risk">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Guardando…" : "Guardar paciente"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
