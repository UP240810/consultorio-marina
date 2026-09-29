import type { SessionSurvey, Patient } from "@/types";
import { NotificationService, EmailChannel } from "./NotificationStrategy";

export interface SurveyObserver {
  onSurveySubmitted(survey: SessionSurvey, patient: Patient): Promise<void>;
}

export class RiskAlertObserver implements SurveyObserver {
  private notifier = new NotificationService(new EmailChannel());

  async onSurveySubmitted(survey: SessionSurvey, patient: Patient): Promise<void> {
    if (!survey.risk_factor) return;

    const doctorEmail = process.env.DOCTOR_ALERT_EMAIL;
    const subject = `Factor de riesgo señalado — ${patient.full_name}`;
    const body = `
      <p>La encuesta post-sesión de <strong>${patient.full_name}</strong> señaló un
      posible factor de riesgo que requiere atención.</p>
      <p><strong>Detalle:</strong> ${survey.risk_factor_detail || "Sin detalle adicional."}</p>
      <p><strong>Nivel de "listo para alta" reportado:</strong> ${survey.discharge_readiness}/10</p>
      <p>Contacto de emergencia registrado: ${patient.emergency_contact_name} —
      ${patient.emergency_contact_phone}</p>
    `;

    if (doctorEmail) {
      await this.notifier.notify(doctorEmail, subject, body);
    }
  }
}

export class StatisticsObserver implements SurveyObserver {
  async onSurveySubmitted(_survey: SessionSurvey, _patient: Patient): Promise<void> {
    
  }
}

export class SurveyService {
  private observers: SurveyObserver[] = [];

  subscribe(observer: SurveyObserver) {
    this.observers.push(observer);
  }

  async notifyAll(survey: SessionSurvey, patient: Patient) {
    await Promise.all(this.observers.map((o) => o.onSurveySubmitted(survey, patient)));
  }
}
