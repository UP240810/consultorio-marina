import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { SupabaseAppointmentRepository } from "@/lib/repositories/AppointmentRepository";
import { NotificationService, EmailChannel } from "@/lib/patterns/NotificationStrategy";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const repo = new SupabaseAppointmentRepository(admin);
  const notifier = new NotificationService(new EmailChannel());

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  const pending = await repo.findPendingReminders(dayStart, dayEnd);
  const results: Array<{ appointment_id: string; status: "enviado" | "fallido"; detail?: string }> = [];

  for (const appt of pending) {
    const patient = appt.patients;
    if (!patient) continue;

    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirmar/${appt.confirm_token}`;
    const hora = new Date(appt.scheduled_at).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      
      
      const to = (patient as any).email;
      if (!to) {
        results.push({
          appointment_id: appt.id,
          status: "fallido",
          detail: "El paciente no tiene correo registrado.",
        });
        continue;
      }

      await notifier.notify(
        to,
        "Confirma tu cita de hoy",
        `<p>Hola ${patient.full_name.split(" ")[0]}, tienes una cita hoy a las <strong>${hora}</strong>.</p>
         <p><a href="${confirmUrl}">Confirma tu asistencia aquí</a></p>`
      );
      await repo.markReminderSent(appt.id);
      await admin.from("reminder_logs").insert({
        appointment_id: appt.id,
        channel: "email",
        status: "enviado",
      });
      results.push({ appointment_id: appt.id, status: "enviado" });
    } catch (err: any) {
      await admin.from("reminder_logs").insert({
        appointment_id: appt.id,
        channel: "email",
        status: "fallido",
        detail: err.message,
      });
      results.push({ appointment_id: appt.id, status: "fallido", detail: err.message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
