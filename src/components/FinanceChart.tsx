"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function FinanceChart({
  data,
}: {
  data: Array<{ month: string; ingreso: number; gasto: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <XAxis dataKey="month" stroke="#4C1D95" fontSize={12} />
        <YAxis stroke="#4C1D95" fontSize={12} />
        <Tooltip formatter={(v: number) => `$${v.toLocaleString("es-MX")}`} />
        <Legend />
        <Bar dataKey="ingreso" name="Ingresos" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="gasto" name="Gastos" fill="#B45309" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
