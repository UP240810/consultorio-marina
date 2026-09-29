import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { SupabaseAppointmentRepository } from "@/lib/repositories/AppointmentRepository";
import SurveyForm from "@/components/SurveyForm";

export default async function EncuestaPage({ params }: { params: { appointmentId: string } }) {
  const admin = getSupabaseAdminClient();
  const repo = new SupabaseAppointmentRepository(admin as any);
  const appointment = await repo.findByToken(params.appointmentId);

  return (
    <main className="min-h-screen bg-mist p-6 flex items-center justify-center">
      <div className="card p-8 max-w-xl w-full">
        <div className="flex items-center gap-3 mb-6">
          <span className="psi-mark w-9 h-9 text-lg">Ψ</span>
          <span className="font-display text-plum">Consultorio Marina Velázquez</span>
        </div>

        {!appointment ? (
          <p className="text-ink/70">
            Este enlace de encuesta no es válido o ya expiró.
          </p>
        ) : (
          <SurveyForm token={params.appointmentId} patientName={appointment.patients?.full_name || ""} />
        )}
      </div>
    </main>
  );
}
