import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePatientRepository } from "@/lib/repositories/PatientRepository";
import NewAppointmentForm from "@/components/NewAppointmentForm";

export default async function NuevaCitaPage({
  searchParams,
}: {
  searchParams: { paciente?: string; fecha?: string; hora?: string };
}) {
  const supabase = getSupabaseServerClient();
  const repo = new SupabasePatientRepository(supabase);
  const patients = await repo.findAll();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-plum">Agendar cita</h1>
      <NewAppointmentForm
        patients={patients}
        defaultPatientId={searchParams.paciente}
        defaultDate={searchParams.fecha}
        defaultTime={searchParams.hora}
      />
    </div>
  );
}
