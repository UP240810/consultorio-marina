import type { Appointment } from "@/types";

export const CLINIC_OPEN_HOUR = 8;
export const CLINIC_CLOSE_HOUR = 20; 
export const SLOT_MINUTES = 50;

export interface DaySlot {
  time: string; 
  iso: string; 
  taken: boolean;
  appointment?: Appointment;
}

export function buildDaySlots(dateISO: string, appointments: Appointment[]): DaySlot[] {
  const slots: DaySlot[] = [];
  const takenByTime = new Map<string, Appointment>();

  for (const appt of appointments) {
    if (appt.status === "cancelada") continue;
    const d = new Date(appt.scheduled_at);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    takenByTime.set(`${hh}:${mm}`, appt);
  }

  for (let minutesFromOpen = 0; ; minutesFromOpen += SLOT_MINUTES) {
    const totalMinutes = CLINIC_OPEN_HOUR * 60 + minutesFromOpen;
    if (totalMinutes >= CLINIC_CLOSE_HOUR * 60) break;
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const mm = String(totalMinutes % 60).padStart(2, "0");
    const time = `${hh}:${mm}`;
    const appt = takenByTime.get(time);
    slots.push({
      time,
      iso: `${dateISO}T${time}:00`,
      taken: Boolean(appt),
      appointment: appt,
    });
  }

  return slots;
}
