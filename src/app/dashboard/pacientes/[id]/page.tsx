import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePatientRepository } from "@/lib/repositories/PatientRepository";
import SessionNoteForm from "@/components/SessionNoteForm";

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();
  const repo = new SupabasePatientRepository(supabase);
  const patient = await repo.findById(params.id);
  if (!patient) notFound();

  const [{ data: notes }, { data: appointments }] = await Promise.all([
    supabase
      .from("session_notes")
      .select("*")
      .eq("patient_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", params.id)
      .order("scheduled_at", { ascending: false })
      .limit(10),
  ]);

  const age = calculateAge(patient.birth_date);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-plum">{patient.full_name}</h1>
          <p className="text-ink/60">
            {age !== null ? `${age} años · ` : ""}
            {patient.occupation || "Ocupación no registrada"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/citas/nueva?paciente=${patient.id}`}
            className="btn-primary"
          >
            + Agendar cita
          </Link>
          <Link
            href={`/dashboard/documentos?paciente=${patient.id}`}
            className="btn-secondary"
          >
            Generar documento
          </Link>
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="card p-5 space-y-3">
          <h2 className="font-display text-lg text-plum">Datos generales</h2>
          <Field label="Teléfono" value={patient.phone} />
          <Field
            label="Contacto de emergencia"
            value={`${patient.emergency_contact_name} · ${patient.emergency_contact_phone}`}
          />
          <Field label="Medicación actual" value={patient.current_medication || "Ninguna registrada"} />
          <Field
            label="Estatus"
            value={
              patient.status === "activo"
                ? "Activo"
                : patient.status === "de_alta"
                ? "De alta"
                : "Pausado"
            }
          />
        </div>

        <div className="card p-5">
          <h2 className="font-display text-lg text-plum mb-3">Últimas citas</h2>
          {!appointments || appointments.length === 0 ? (
            <p className="text-sm text-ink/50">Sin citas registradas.</p>
          ) : (
            <ul className="space-y-2">
              {appointments.map((a) => (
                <li key={a.id} className="flex justify-between text-sm">
                  <span>
                    {new Date(a.scheduled_at).toLocaleString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-ink/50">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <h2 className="font-display text-lg text-plum">Notas de sesión</h2>
        <SessionNoteForm patientId={patient.id} />
        <ul className="divide-y divide-lilac/15">
          {(notes || []).map((n) => (
            <li key={n.id} className="py-3">
              <p className="text-sm text-ink/50">
                {new Date(n.created_at).toLocaleString("es-MX")}
              </p>
              <p className="mt-1">{n.content}</p>
            </li>
          ))}
          {(!notes || notes.length === 0) && (
            <p className="text-sm text-ink/50 py-3">Aún no hay notas registradas.</p>
          )}
        </ul>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink/40">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
