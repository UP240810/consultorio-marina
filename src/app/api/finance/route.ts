import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  if (!body.kind || !body.concept || body.amount == null) {
    return NextResponse.json({ error: "Faltan datos del movimiento" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("finance_entries")
    .insert({
      kind: body.kind,
      concept: body.concept,
      amount: body.amount,
      entry_date: body.entry_date || new Date().toISOString().slice(0, 10),
      appointment_id: body.appointment_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}
