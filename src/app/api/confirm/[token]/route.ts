import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { SupabaseAppointmentRepository } from "@/lib/repositories/AppointmentRepository";

/**
 * Ruta pública (sin sesión). El paciente llega aquí desde el enlace que le
 * envía el recordatorio diario. Usa el cliente con Service Role porque no
 * hay usuario autenticado, pero solo expone la confirmación de UNA cita
 * identificada por un UUID de token impredecible (confirm_token).
 */
export async function POST(_request: Request, { params }: { params: { token: string } }) {
  const admin = getSupabaseAdminClient();
  const repo = new SupabaseAppointmentRepository(admin as any);

  try {
    const appointment = await repo.confirmByToken(params.token);
    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: "Enlace inválido o cita no encontrada." }, { status: 404 });
  }
}
