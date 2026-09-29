"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Patient } from "@/types";
import { buildDaySlots } from "@/lib/utils/schedule";
import { useToast } from "@/components/Toast";

export default function NewAppointmentForm({
  patients,
  defaultPatientId,
  defaultDate,
  defaultTime,
}: {
  patients: Patient[];
  defaultPatientId?: string;
  defaultDate?: string;
  defaultTime?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [patientId, setPatientId] = useState(defaultPatientId || "");
  const [date, setDate] = useState(defaultDate || today);
  const [time, setTime] = useState(defaultTime || "");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const slots = buildDaySlots(date, []).map((s) => s.time);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!patientId || !date || !time) {
      setError("Selecciona paciente, fecha y hora.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, date, time, price: Number(price) || 0 }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "No se pudo agendar la cita.");
      return;
    }
    router.push(`/dashboard/agenda?date=${date}`);
    router.refresh();
    toast("Cita agendada", "success");
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-lg">
      <div>
        <label className="field-label">Paciente</label>
        <select
          className="input-field"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          required
        >
          <option value="">Selecciona un paciente</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Fecha</label>
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label">Hora</label>
          <select className="input-field" value={time} onChange={(e) => setTime(e.target.value)} required>
            <option value="">Selecciona hora</option>
            {slots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label">Costo de la sesión (opcional)</label>
        <input
          type="number"
          min="0"
          className="input-field"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
        />
      </div>

      {error && <p className="text-sm text-risk">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Agendando…" : "Agendar cita"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
