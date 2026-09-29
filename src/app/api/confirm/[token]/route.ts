import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { SupabaseAppointmentRepository } from "@/lib/repositories/AppointmentRepository";

export async function POST(_request: Request, { params }: { params: { token: string } }) {
  const admin = getSupabaseAdminClient();
  const repo = new SupabaseAppointmentRepository(admin);

  try {
    const appointment = await repo.confirmByToken(params.token);
    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: "Enlace inválido o cita no encontrada." }, { status: 404 });
  }
}
