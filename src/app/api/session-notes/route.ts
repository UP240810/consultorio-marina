import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  if (!body.patient_id || !body.content) {
    return NextResponse.json({ error: "Faltan datos de la nota" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("session_notes")
    .insert({
      patient_id: body.patient_id,
      appointment_id: body.appointment_id || null,
      content: body.content,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}
