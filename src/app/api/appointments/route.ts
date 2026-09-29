import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseAppointmentRepository } from "@/lib/repositories/AppointmentRepository";
import { CLINIC_OPEN_HOUR, CLINIC_CLOSE_HOUR } from "@/lib/utils/schedule";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { patient_id, date, time, duration_minutes, price } = body;
  if (!patient_id || !date || !time) {
    return NextResponse.json({ error: "Faltan datos de la cita" }, { status: 400 });
  }

  const hour = Number(time.split(":")[0]);
  if (hour < CLINIC_OPEN_HOUR || hour >= CLINIC_CLOSE_HOUR) {
    return NextResponse.json(
      { error: "El horario de atención es de 8:00 a.m. a 8:00 p.m." },
      { status: 400 }
    );
  }

  const repo = new SupabaseAppointmentRepository(supabase);
  try {
    const appointment = await repo.create({
      patient_id,
      scheduled_at: `${date}T${time}:00`,
      duration_minutes: duration_minutes || 50,
      price: price || 0,
    });
    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
