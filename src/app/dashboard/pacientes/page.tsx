import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePatientRepository } from "@/lib/repositories/PatientRepository";

export default async function PacientesPage() {
  const supabase = getSupabaseServerClient();
  const repo = new SupabasePatientRepository(supabase);
  const patients = await repo.findAll();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-plum">Pacientes</h1>
          <p className="text-ink/60">{patients.length} pacientes registrados</p>
        </div>
        <Link href="/dashboard/pacientes/nuevo" className="btn-primary">
          + Nuevo paciente
        </Link>
      </header>

      <div className="card divide-y divide-lilac/15">
        {patients.length === 0 && (
          <p className="p-6 text-ink/50 text-sm">Aún no hay pacientes registrados.</p>
        )}
        {patients.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/pacientes/${p.id}`}
            className="flex items-center justify-between p-4 hover:bg-mist transition-colors"
          >
            <div>
              <p className="font-medium">{p.full_name}</p>
              <p className="text-sm text-ink/50">{p.occupation || "Ocupación no registrada"}</p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                p.status === "activo"
                  ? "bg-ok/10 text-ok"
                  : p.status === "de_alta"
                  ? "bg-plum/10 text-plum"
                  : "bg-risk/10 text-risk"
              }`}
            >
              {p.status === "activo" ? "Activo" : p.status === "de_alta" ? "De alta" : "Pausado"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
