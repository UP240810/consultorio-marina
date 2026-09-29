import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePatientRepository } from "@/lib/repositories/PatientRepository";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const required = ["full_name", "phone", "emergency_contact_name", "emergency_contact_phone"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Falta el campo ${field}` }, { status: 400 });
    }
  }

  const repo = new SupabasePatientRepository(supabase);
  try {
    const patient = await repo.create({
      full_name: body.full_name,
      birth_date: body.birth_date || null,
      occupation: body.occupation || null,
      phone: body.phone,
      email: body.email || null,
      emergency_contact_name: body.emergency_contact_name,
      emergency_contact_phone: body.emergency_contact_phone,
      current_medication: body.current_medication || null,
      status: "activo",
      intake_notes: body.intake_notes || null,
    });
    return NextResponse.json({ patient });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
