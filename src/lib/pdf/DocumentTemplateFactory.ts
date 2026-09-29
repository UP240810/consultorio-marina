import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { DocumentRequest, DocumentType } from "@/types";

const PURPLE = rgb(0.30, 0.11, 0.58); // #4C1D95
const LILAC = rgb(0.545, 0.361, 0.965); // #8B5CF6
const INK = rgb(0.18, 0.16, 0.24);
const GREY = rgb(0.45, 0.45, 0.5);

const DOCTOR = {
  name: "Psic. Marina Velázquez Tristán",
  specialty: "Psicología Cognitivo-Conductual  |  Terapia Gestalt",
  professionalLicense: "13619201",
  mastersLicense: "9718535",
  city: "Calvillo, Aguascalientes",
};

const TITLES: Record<DocumentType, string> = {
  justificante: "JUSTIFICANTE DE ATENCIÓN PSICOLÓGICA",
  constancia: "CONSTANCIA DE ASISTENCIA A TERAPIA PSICOLÓGICA",
  permiso_escolar: "PERMISO / SOLICITUD DE JUSTIFICACIÓN ESCOLAR",
};

function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${d} de ${meses[m - 1]} de ${y}`;
}

/** Cuerpo del documento en párrafos, según el tipo. Base del "Factory Method". */
function buildBodyParagraphs(req: DocumentRequest): string[] {
  const age = req.patient_age ? `, de ${req.patient_age} años,` : ",";
  const single = !req.period_end || req.period_end === req.period_start;
  const periodo = single
    ? `el día ${formatDateEs(req.period_start)}`
    : `el periodo comprendido del ${formatDateEs(req.period_start)} al ${formatDateEs(
        req.period_end!
      )}`;

  switch (req.document_type) {
    case "justificante":
      return [
        `Por medio de la presente, hago constar que el/la paciente ${req.patient_name}${age} ` +
          `se encuentra en proceso de atención psicológica y, debido a una situación relacionada ` +
          `con su bienestar emocional, requirió acompañamiento profesional durante ${periodo}.`,
        `Por lo anterior, se extiende el presente justificante para los fines académicos o ` +
          `laborales que a la persona interesada convengan, solicitando atentamente se consideren ` +
          `justificadas sus inasistencias durante el periodo señalado.`,
        req.custom_reason ? `Nota adicional: ${req.custom_reason}` : "",
      ].filter(Boolean);
    case "constancia":
      return [
        `Por medio de la presente, hago constar que el/la paciente ${req.patient_name}${age} ` +
          `ha asistido de manera regular a terapia psicológica en este consultorio durante ${periodo}.`,
        req.diagnosis_text
          ? `Diagnóstico / motivo de atención: ${req.diagnosis_text}.`
          : "",
        `Se extiende la presente constancia para los fines que a la persona interesada convengan.`,
        req.custom_reason ? `Nota adicional: ${req.custom_reason}` : "",
      ].filter(Boolean);
    case "permiso_escolar":
      return [
        `Por medio de la presente, solicito atentamente se conceda permiso o se justifique la ` +
          `inasistencia del/de la alumno(a) ${req.patient_name}${age} durante ${periodo}, debido a que ` +
          `se encuentra bajo atención psicológica en este consultorio.`,
        req.custom_reason ? `Motivo adicional: ${req.custom_reason}` : "",
        `Agradezco de antemano las facilidades que la institución educativa pueda brindar.`,
      ].filter(Boolean);
  }
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Factory Method: `generate` construye el PDF final combinando membrete +
 * título + cuerpo según `document_type`, con el mismo acabado visual para
 * los tres tipos de documento.
 */
export async function generateDocumentPdf(req: DocumentRequest): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // carta
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const boldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const marginX = 64;
  let y = height - 60;

  // --- Membrete ---
  page.drawCircle({ x: marginX + 20, y: y - 12, size: 22, color: LILAC });
  page.drawText("\u03A8", {
    x: marginX + 12,
    y: y - 21,
    size: 24,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(DOCTOR.name, {
    x: marginX + 56,
    y: y - 8,
    size: 14,
    font: bold,
    color: PURPLE,
  });
  page.drawText(DOCTOR.specialty, {
    x: marginX + 56,
    y: y - 24,
    size: 9.5,
    font,
    color: INK,
  });
  page.drawText(
    `Cédula Profesional: ${DOCTOR.professionalLicense}    Cédula de Maestría: ${DOCTOR.mastersLicense}`,
    { x: marginX + 56, y: y - 38, size: 9, font, color: GREY }
  );

  y -= 56;
  page.drawLine({
    start: { x: marginX, y },
    end: { x: width - marginX, y },
    thickness: 1.5,
    color: PURPLE,
  });

  // --- Título ---
  y -= 40;
  const title = TITLES[req.document_type];
  const titleSize = 16;
  const titleWidth = bold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y,
    size: titleSize,
    font: bold,
    color: PURPLE,
  });

  y -= 20;
  const sub = "A QUIEN CORRESPONDA";
  const subWidth = font.widthOfTextAtSize(sub, 10);
  page.drawText(sub, { x: (width - subWidth) / 2, y, size: 10, font, color: GREY });

  // --- Cuerpo ---
  y -= 40;
  const bodySize = 11;
  const maxWidth = width - marginX * 2;
  for (const paragraph of buildBodyParagraphs(req)) {
    const lines = wrapText(paragraph, font, bodySize, maxWidth);
    for (const line of lines) {
      page.drawText(line, { x: marginX, y, size: bodySize, font, color: INK });
      y -= bodySize * 1.6;
    }
    y -= bodySize * 0.8;
  }

  // --- Cierre y firma ---
  y -= 30;
  page.drawText("Atentamente", { x: marginX, y, size: 11, font: bold, color: INK });

  y -= 20;
  const cityLine = `${req.issued_at_city || DOCTOR.city}, a ${formatDateEs(
    new Date().toISOString().slice(0, 10)
  )}.`;
  const cityWidth = font.widthOfTextAtSize(cityLine, 10.5);
  page.drawText(cityLine, {
    x: width - marginX - cityWidth,
    y,
    size: 10.5,
    font,
    color: INK,
  });

  // Línea y datos de firma
  const signY = 150;
  page.drawLine({
    start: { x: width / 2 - 110, y: signY },
    end: { x: width / 2 + 110, y: signY },
    thickness: 1,
    color: GREY,
  });
  const nameW = bold.widthOfTextAtSize(DOCTOR.name, 11);
  page.drawText(DOCTOR.name, {
    x: (width - nameW) / 2,
    y: signY - 16,
    size: 11,
    font: bold,
    color: PURPLE,
  });
  const specW = font.widthOfTextAtSize(DOCTOR.specialty, 9);
  page.drawText(DOCTOR.specialty, {
    x: (width - specW) / 2,
    y: signY - 30,
    size: 9,
    font,
    color: INK,
  });
  const licenseLine = `Cédula Profesional: ${DOCTOR.professionalLicense} \u2022 Cédula de Maestría: ${DOCTOR.mastersLicense}`;
  const licenseW = font.widthOfTextAtSize(licenseLine, 8.5);
  page.drawText(licenseLine, {
    x: (width - licenseW) / 2,
    y: signY - 42,
    size: 8.5,
    font,
    color: GREY,
  });

  // --- Pie de página ---
  const footer1 = "Documento de carácter confidencial. Válido únicamente para los fines señalados.";
  const footer1W = boldItalic.widthOfTextAtSize(footer1, 8.5);
  page.drawText(footer1, {
    x: (width - footer1W) / 2,
    y: 60,
    size: 8.5,
    font: boldItalic,
    color: GREY,
  });
  const footer2 = `${DOCTOR.city}, México`;
  const footer2W = font.widthOfTextAtSize(footer2, 8.5);
  page.drawText(footer2, { x: (width - footer2W) / 2, y: 48, size: 8.5, font, color: GREY });
  page.drawLine({
    start: { x: marginX, y: 72 },
    end: { x: width - marginX, y: 72 },
    thickness: 0.5,
    color: rgb(0.85, 0.83, 0.92),
  });

  return pdfDoc.save();
}
