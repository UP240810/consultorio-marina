import type { SupabaseClient } from "@supabase/supabase-js";

export interface MonthSummary {
  income: number;
  expenses: number;
  balance: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  appointmentsNoShow: number;
}

/** Agrupa consultas de estadísticas para no repetirlas en cada página. */
export class StatisticsService {
  constructor(private readonly db: SupabaseClient) {}

  async monthSummary(monthStartISO: string, monthEndISO: string): Promise<MonthSummary> {
    const [{ data: finance }, { data: appts }] = await Promise.all([
      this.db
        .from("finance_entries")
        .select("kind, amount")
        .gte("entry_date", monthStartISO)
        .lte("entry_date", monthEndISO),
      this.db
        .from("appointments")
        .select("status")
        .gte("scheduled_at", monthStartISO)
        .lte("scheduled_at", monthEndISO),
    ]);

    const income = (finance || [])
      .filter((f) => f.kind === "ingreso")
      .reduce((sum, f) => sum + Number(f.amount), 0);
    const expenses = (finance || [])
      .filter((f) => f.kind === "gasto")
      .reduce((sum, f) => sum + Number(f.amount), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      appointmentsCompleted: (appts || []).filter((a) => a.status === "completada").length,
      appointmentsCancelled: (appts || []).filter((a) => a.status === "cancelada").length,
      appointmentsNoShow: (appts || []).filter((a) => a.status === "no_asistio").length,
    };
  }

  async incomeVsExpenseByMonth(monthsBack = 6) {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
    const { data } = await this.db
      .from("finance_entries")
      .select("kind, amount, entry_date")
      .gte("entry_date", from.toISOString().slice(0, 10));

    const buckets = new Map<string, { ingreso: number; gasto: number }>();
    for (let i = 0; i < monthsBack; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, { ingreso: 0, gasto: 0 });
    }
    for (const row of data || []) {
      const key = row.entry_date.slice(0, 7);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      if (row.kind === "ingreso") bucket.ingreso += Number(row.amount);
      else bucket.gasto += Number(row.amount);
    }
    return Array.from(buckets.entries()).map(([month, v]) => ({ month, ...v }));
  }
}
