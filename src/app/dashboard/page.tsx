import { getSupabaseServerClient } from "@/lib/supabase/server";
import { StatisticsService } from "@/lib/services/StatisticsService";
import { SupabaseAppointmentRepository } from "@/lib/repositories/AppointmentRepository";
import Link from "next/link";
import StatsRow from "@/components/StatsRow";

function todayRangeISO() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

function monthRangeISO() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default async function DashboardHome() {
  const supabase = getSupabaseServerClient();
  const apptRepo = new SupabaseAppointmentRepository(supabase);
  const stats = new StatisticsService(supabase);

  const { start: dayStart, end: dayEnd } = todayRangeISO();
  const { start: monthStart, end: monthEnd } = monthRangeISO();

  const [todayAppts, summary] = await Promise.all([
    apptRepo.findByDateRange(dayStart, dayEnd),
    stats.monthSummary(monthStart, monthEnd),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-plum">Hola, Marina</h1>
        <p className="text-ink/60">
          Hoy es {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </header>

      <StatsRow
        items={[
          { label: "Citas de hoy", value: String(todayAppts.length) },
          { label: "Ingresos del mes", value: `$${summary.income.toLocaleString("es-MX")}` },
          { label: "Gastos del mes", value: `$${summary.expenses.toLocaleString("es-MX")}` },
          {
            label: "Balance del mes",
            value: `$${summary.balance.toLocaleString("es-MX")}`,
            highlight: summary.balance >= 0 ? "ok" : "risk",
          },
        ]}
      />
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-plum">Agenda de hoy</h2>
          <Link href="/dashboard/agenda" className="text-sm text-violet hover:underline">
            Ver agenda completa →
          </Link>
        </div>
        {todayAppts.length === 0 ? (
          <p className="text-ink/50 text-sm">No hay citas agendadas para hoy.</p>
        ) : (
          <ul className="divide-y divide-lilac/15">
            {todayAppts.map((appt) => (
              <li key={appt.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{appt.patients?.full_name}</p>
                  <p className="text-sm text-ink/50">
                    {new Date(appt.scheduled_at).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <StatusBadge status={appt.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    agendada: "bg-lilac/15 text-plum",
    confirmada: "bg-ok/10 text-ok",
    cancelada: "bg-risk/10 text-risk",
    completada: "bg-plum/10 text-plum",
    no_asistio: "bg-risk/10 text-risk",
  };
  const labels: Record<string, string> = {
    agendada: "Agendada",
    confirmada: "Confirmada",
    cancelada: "Cancelada",
    completada: "Completada",
    no_asistio: "No asistió",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${styles[status]}`}>{labels[status]}</span>
  );
}
