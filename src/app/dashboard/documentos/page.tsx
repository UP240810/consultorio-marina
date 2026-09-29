import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePatientRepository } from "@/lib/repositories/PatientRepository";
import DocumentForm from "@/components/DocumentForm";

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: { paciente?: string };
}) {
  const supabase = getSupabaseServerClient();
  const repo = new SupabasePatientRepository(supabase);
  const patients = await repo.findAll();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-plum">Documentos</h1>
        <p className="text-ink/60">
          Genera justificantes, constancias o permisos escolares personalizados en PDF.
        </p>
      </div>
      <DocumentForm patients={patients} defaultPatientId={searchParams.paciente} />
    </div>
  );
}
