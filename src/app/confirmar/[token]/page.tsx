import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { SupabaseAppointmentRepository } from "@/lib/repositories/AppointmentRepository";
import ConfirmButton from "@/components/ConfirmButton";

export default async function ConfirmarCitaPage({ params }: { params: { token: string } }) {
  const admin = getSupabaseAdminClient();
  const repo = new SupabaseAppointmentRepository(admin as any);
  const appointment = await repo.findByToken(params.token);

  if (!appointment) {
    return (
      <Shell>
        <p className="text-ink/70">
          Este enlace no es válido o la cita ya no está disponible. Si crees que es un error,
          comunícate directamente al consultorio.
        </p>
      </Shell>
    );
  }

  const fecha = new Date(appointment.scheduled_at).toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Shell>
      <p className="text-ink/70 mb-1">Hola {appointment.patients?.full_name?.split(" ")[0]},</p>
      <p className="text-ink/70 mb-6">
        Tienes una cita agendada para el <strong>{fecha}</strong>. Por favor confirma tu
        asistencia:
      </p>
      {appointment.status === "confirmada" ? (
        <p className="text-ok font-medium">✓ Tu cita ya está confirmada. Te esperamos.</p>
      ) : appointment.status === "cancelada" ? (
        <p className="text-risk font-medium">Esta cita fue cancelada.</p>
      ) : (
        <ConfirmButton token={params.token} />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-mist p-6">
      <div className="card p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <span className="psi-mark w-9 h-9 text-lg">Ψ</span>
          <span className="font-display text-plum">Consultorio Marina Velázquez</span>
        </div>
        {children}
      </div>
    </main>
  );
}
