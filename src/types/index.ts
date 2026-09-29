export type PatientStatus = "activo" | "de_alta" | "pausado";

export interface Patient {
  id: string;
  doctor_id: string;
  full_name: string;
  birth_date: string | null;
  occupation: string | null;
  phone: string;
  email: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  current_medication: string | null;
  status: PatientStatus;
  intake_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus =
  | "agendada"
  | "confirmada"
  | "cancelada"
  | "completada"
  | "no_asistio";

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  confirm_token: string;
  confirmed_at: string | null;
  reminder_sent_at: string | null;
  price: number;
  created_at: string;
  patients?: Patient;
}

export interface SessionNote {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  content: string;
  created_at: string;
}

export interface SessionSurvey {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  mood_answers: Record<string, string>;
  discharge_readiness: number;
  risk_factor: boolean;
  risk_factor_detail: string | null;
  emergency_contact_notified: boolean;
  created_at: string;
}

export type FinanceKind = "ingreso" | "gasto";

export interface FinanceEntry {
  id: string;
  doctor_id: string;
  kind: FinanceKind;
  concept: string;
  amount: number;
  appointment_id: string | null;
  entry_date: string;
  created_at: string;
}

export type DocumentType = "justificante" | "constancia" | "permiso_escolar";

export interface DocumentRequest {
  document_type: DocumentType;
  patient_name: string;
  patient_age?: number;
  period_start: string;
  period_end?: string;
  diagnosis_text?: string;
  custom_reason?: string;
  issued_at_city?: string;
}

export const SURVEY_QUESTIONS: Array<{
  id: string;
  label: string;
  options: string[];
}> = [
  {
    id: "estado_animo",
    label: "¿Cómo describirías tu estado de ánimo durante la sesión de hoy?",
    options: ["Muy bajo", "Bajo", "Estable", "Bueno", "Muy bueno"],
  },
  {
    id: "nivel_ansiedad",
    label: "¿Cómo sentiste tu nivel de ansiedad hoy?",
    options: ["Muy alto", "Alto", "Moderado", "Bajo", "Ninguno"],
  },
  {
    id: "apertura",
    label: "¿Qué tan cómodo/a te sentiste hablando en esta sesión?",
    options: ["Nada cómodo", "Poco cómodo", "Neutral", "Cómodo", "Muy cómodo"],
  },
  {
    id: "sueno",
    label: "¿Cómo ha sido tu descanso/sueño esta semana?",
    options: ["Muy malo", "Malo", "Regular", "Bueno", "Muy bueno"],
  },
];
