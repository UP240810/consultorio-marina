import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NotificationService, EmailChannel } from "@/lib/patterns/NotificationStrategy";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ status: "completada" })
    .eq("id", params.id)
    .select("*, patients(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const patient = appointment.patients;
  if (patient?.email) {
    const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/encuesta/${appointment.confirm_token}`;
    const notifier = new NotificationService(new EmailChannel());
    try {
      await notifier.notify(
        patient.email,
        "Cuéntanos cómo te fue en tu sesión de hoy",
        `<p>Hola ${patient.full_name.split(" ")[0]}, nos gustaría conocer cómo te sentiste hoy.</p>
         <p><a href="${surveyUrl}">Responder encuesta breve (2 minutos)</a></p>`
      );
    } catch {
      
    }
  }

  return NextResponse.json({ appointment });
}
