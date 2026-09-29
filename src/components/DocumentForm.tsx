"use client";

import { useState } from "react";
import type { Patient } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  justificante: "Justificante de atención psicológica",
  constancia: "Constancia de asistencia a terapia",
  permiso_escolar: "Permiso / justificación escolar",
};

export default function DocumentForm({
  patients,
  defaultPatientId,
}: {
  patients: Patient[];
  defaultPatientId?: string;
}) {
  const [patientId, setPatientId] = useState(defaultPatientId || "");
  const [documentType, setDocumentType] = useState<"justificante" | "constancia" | "permiso_escolar">(
    "justificante"
  );
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [diagnosisText, setDiagnosisText] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPatient = patients.find((p) => p.id === patientId);
  const age = selectedPatient?.birth_date
    ? Math.floor(
        (Date.now() - new Date(selectedPatient.birth_date).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      )
    : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedPatient || !periodStart) {
      setError("Selecciona un paciente y la fecha o periodo.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/pdf/justificante", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: selectedPatient.id,
        patient_name: selectedPatient.full_name,
        patient_age: age,
        document_type: documentType,
        period_start: periodStart,
        period_end: periodEnd || periodStart,
        diagnosis_text: diagnosisText || undefined,
        custom_reason: customReason || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo generar el documento.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentType}-${selectedPatient.full_name.replace(/\s+/g, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-xl">
      <div>
        <label className="field-label">Tipo de documento</label>
        <select
          className="input-field"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as typeof documentType)}
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label">Paciente</label>
        <select className="input-field" value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
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
          <label className="field-label">Desde</label>
          <input
            type="date"
            className="input-field"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label">Hasta (opcional)</label>
          <input
            type="date"
            className="input-field"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>
      </div>

      {documentType === "constancia" && (
        <div>
          <label className="field-label">Diagnóstico / motivo (opcional)</label>
          <input
            className="input-field"
            value={diagnosisText}
            onChange={(e) => setDiagnosisText(e.target.value)}
          />
        </div>
      )}

      <div>
        <label className="field-label">Nota adicional (opcional)</label>
        <textarea
          className="input-field"
          rows={2}
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-risk">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Generando…" : "Generar PDF"}
      </button>
    </form>
  );
}
