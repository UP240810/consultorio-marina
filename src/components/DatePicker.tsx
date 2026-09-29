"use client";

import { useRouter } from "next/navigation";

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function DatePicker({ date }: { date: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <button className="btn-secondary" onClick={() => router.push(`/dashboard/agenda?date=${shiftDate(date, -1)}`)}>
        ← Día anterior
      </button>
      <input
        type="date"
        value={date}
        onChange={(e) => router.push(`/dashboard/agenda?date=${e.target.value}`)}
        className="input-field w-auto"
      />
      <button className="btn-secondary" onClick={() => router.push(`/dashboard/agenda?date=${shiftDate(date, 1)}`)}>
        Día siguiente →
      </button>
      <button
        className="text-sm text-violet hover:underline ml-2"
        onClick={() => router.push(`/dashboard/agenda?date=${new Date().toISOString().slice(0, 10)}`)}
      >
        Hoy
      </button>
    </div>
  );
}
