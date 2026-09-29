import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseAppointmentRepository } from "@/lib/repositories/AppointmentRepository";
import { buildDaySlots } from "@/lib/utils/schedule";
import DatePicker from "@/components/DatePicker";
import CompleteAppointmentButton from "@/components/CompleteAppointmentButton";

function dayBoundsISO(dateStr: string) {
  return {
    start: `${dateStr}T00:00:00`,
    end: `${dateStr}T23:59:59`,
  };
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const dateStr = searchParams.date || new Date().toISOString().slice(0, 10);
  const supabase = getSupabaseServerClient();
  const repo = new SupabaseAppointmentRepository(supabase);
  const { start, end } = dayBoundsISO(dateStr);
  const appointments = await repo.findByDateRange(start, end);
  const slots = buildDaySlots(dateStr, appointments);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-plum">Agenda</h1>
          <p className="text-ink/60">Horario de atención: 8:00 a.m. — 8:00 p.m.</p>
        </div>
        <Link href={`/dashboard/citas/nueva?fecha=${dateStr}`} className="btn-primary">
          + Nueva cita
        </Link>
      </header>

      <DatePicker date={dateStr} />

      <div className="card divide-y divide-lilac/15">
        {slots.map((slot) => (
          <div key={slot.time} className="flex items-center justify-between px-5 py-3">
            <span className="w-16 text-sm font-medium text-plum">{slot.time}</span>
            {slot.taken && slot.appointment ? (
              <Link
                href={`/dashboard/pacientes/${slot.appointment.patient_id}`}
                className="flex-1 ml-4 flex items-center justify-between rounded-card bg-mist px-3 py-2 hover:bg-lilac/15 transition-colors"
              >
                <span className="font-medium">{slot.appointment.patients?.full_name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-ink/50">{slot.appointment.status}</span>
                  {slot.appointment.status !== "completada" && (
                    <CompleteAppointmentButton appointmentId={slot.appointment.id} />
                  )}
                </span>
              </Link>
            ) : (
              <Link
                href={`/dashboard/citas/nueva?fecha=${dateStr}&hora=${slot.time}`}
                className="flex-1 ml-4 text-sm text-ink/30 hover:text-violet transition-colors"
              >
                Disponible — agendar
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
