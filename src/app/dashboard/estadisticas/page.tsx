import { getSupabaseServerClient } from "@/lib/supabase/server";
import { StatisticsService } from "@/lib/services/StatisticsService";
import FinanceChart from "@/components/FinanceChart";
import FinanceEntryForm from "@/components/FinanceEntryForm";
import StatsRow from "@/components/StatsRow";

function monthRangeISO() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default async function EstadisticasPage() {
  const supabase = getSupabaseServerClient();
  const stats = new StatisticsService(supabase);
  const { start, end } = monthRangeISO();

  const [summary, chartData] = await Promise.all([
    stats.monthSummary(start, end),
    stats.incomeVsExpenseByMonth(6),
  ]);

  const { data: recentEntries } = await supabase
    .from("finance_entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .limit(8);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-plum">Estadísticas</h1>

      <StatsRow
        items={[
          { label: "Ingresos del mes", value: `$${summary.income.toLocaleString("es-MX")}` },
          { label: "Gastos del mes", value: `$${summary.expenses.toLocaleString("es-MX")}` },
          {
            label: "Balance del mes",
            value: `$${summary.balance.toLocaleString("es-MX")}`,
            highlight: summary.balance >= 0 ? "ok" : "risk",
          },
          { label: "Citas completadas", value: String(summary.appointmentsCompleted) },
        ]}
      />
      <StatsRow
        items={[
          { label: "Citas canceladas", value: String(summary.appointmentsCancelled) },
          { label: "Inasistencias", value: String(summary.appointmentsNoShow) },
        ]}
      />

      <section className="card p-6">
        <h2 className="font-display text-lg text-plum mb-4">Ingresos vs. gastos (últimos 6 meses)</h2>
        <FinanceChart data={chartData} />
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="font-display text-lg text-plum">Registrar movimiento</h2>
        <FinanceEntryForm />
        <ul className="divide-y divide-lilac/15 mt-4">
          {(recentEntries || []).map((e) => (
            <li key={e.id} className="py-2 flex justify-between text-sm">
              <span>
                {e.concept} · {new Date(e.entry_date).toLocaleDateString("es-MX")}
              </span>
              <span className={e.kind === "ingreso" ? "text-ok" : "text-risk"}>
                {e.kind === "ingreso" ? "+" : "-"}${Number(e.amount).toLocaleString("es-MX")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
