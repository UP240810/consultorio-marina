import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePatientRepository } from "@/lib/repositories/PatientRepository";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const repo = new SupabasePatientRepository(supabase);
  try {
    const patient = await repo.update(params.id, body);
    return NextResponse.json({ patient });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
