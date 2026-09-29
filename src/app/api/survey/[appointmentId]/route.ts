import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { SupabaseAppointmentRepository } from "@/lib/repositories/AppointmentRepository";
import { SurveyService, RiskAlertObserver, StatisticsObserver } from "@/lib/patterns/SurveyObserver";
import type { SessionSurvey } from "@/types";

export async function POST(request: Request, { params }: { params: { appointmentId: string } }) {
  const admin = getSupabaseAdminClient();
  const apptRepo = new SupabaseAppointmentRepository(admin);

  const appointment = await apptRepo.findByToken(params.appointmentId);
  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const body = await request.json();
  const { data: survey, error } = await admin
    .from("session_surveys")
    .insert({
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      mood_answers: body.mood_answers || {},
      discharge_readiness: body.discharge_readiness,
      risk_factor: Boolean(body.risk_factor),
      risk_factor_detail: body.risk_factor_detail || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Patrón Observer: si hay riesgo, se notifica sin acoplar esa lógica aquí.
  const service = new SurveyService();
  service.subscribe(new RiskAlertObserver());
  service.subscribe(new StatisticsObserver());
  if (appointment.patients) {
    await service.notifyAll(survey as SessionSurvey, appointment.patients);
  }

  return NextResponse.json({ ok: true });
}
