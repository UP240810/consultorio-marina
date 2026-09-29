import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateDocumentPdf } from "@/lib/pdf/DocumentTemplateFactory";
import type { DocumentRequest } from "@/types";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await request.json()) as DocumentRequest & { patient_id?: string };

  if (!body.document_type || !body.patient_name || !body.period_start) {
    return NextResponse.json({ error: "Faltan datos del documento" }, { status: 400 });
  }

  const pdfBytes = await generateDocumentPdf(body);

  if (body.patient_id) {
    await supabase.from("issued_documents").insert({
      patient_id: body.patient_id,
      document_type: body.document_type,
      period_start: body.period_start,
      period_end: body.period_end || body.period_start,
      diagnosis_text: body.diagnosis_text || null,
      custom_reason: body.custom_reason || null,
    });
  }

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${body.document_type}-${body.patient_name.replace(
        /\s+/g,
        "_"
      )}.pdf"`,
    },
  });
}
