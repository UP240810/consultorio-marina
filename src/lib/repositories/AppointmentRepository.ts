import type { SupabaseClient } from "@supabase/supabase-js";
import type { Appointment } from "@/types";

export interface IAppointmentRepository {
  findByDateRange(from: string, to: string): Promise<Appointment[]>;
  findById(id: string): Promise<Appointment | null>;
  findByToken(token: string): Promise<Appointment | null>;
  create(data: {
    patient_id: string;
    scheduled_at: string;
    duration_minutes?: number;
    price?: number;
  }): Promise<Appointment>;
  updateStatus(id: string, status: Appointment["status"]): Promise<Appointment>;
  confirmByToken(token: string): Promise<Appointment>;
  findPendingReminders(dayStart: string, dayEnd: string): Promise<Appointment[]>;
  markReminderSent(id: string): Promise<void>;
}

export class SupabaseAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly db: SupabaseClient<any>) {}

  async findByDateRange(from: string, to: string): Promise<Appointment[]> {
    const { data, error } = await this.db
      .from("appointments")
      .select("*, patients(*)")
      .gte("scheduled_at", from)
      .lte("scheduled_at", to)
      .order("scheduled_at", { ascending: true });
    if (error) throw error;
    return data as Appointment[];
  }

  async findById(id: string): Promise<Appointment | null> {
    const { data, error } = await this.db
      .from("appointments")
      .select("*, patients(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Appointment | null;
  }

  async findByToken(token: string): Promise<Appointment | null> {
    const { data, error } = await this.db
      .from("appointments")
      .select("*, patients(*)")
      .eq("confirm_token", token)
      .maybeSingle();
    if (error) throw error;
    return data as Appointment | null;
  }

  async create(data: {
    patient_id: string;
    scheduled_at: string;
    duration_minutes?: number;
    price?: number;
  }): Promise<Appointment> {
    const { data: created, error } = await this.db
      .from("appointments")
      .insert({
        patient_id: data.patient_id,
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes ?? 50,
        price: data.price ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return created as Appointment;
  }

  async updateStatus(id: string, status: Appointment["status"]): Promise<Appointment> {
    const { data, error } = await this.db
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Appointment;
  }

  
  async confirmByToken(token: string): Promise<Appointment> {
    const { data, error } = await this.db
      .from("appointments")
      .update({ status: "confirmada", confirmed_at: new Date().toISOString() })
      .eq("confirm_token", token)
      .select()
      .single();
    if (error) throw error;
    return data as Appointment;
  }

  
  async findPendingReminders(dayStart: string, dayEnd: string): Promise<Appointment[]> {
    const { data, error } = await this.db
      .from("appointments")
      .select("*, patients(*)")
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd)
      .is("reminder_sent_at", null)
      .in("status", ["agendada", "confirmada"]);
    if (error) throw error;
    return data as Appointment[];
  }

  async markReminderSent(id: string): Promise<void> {
    const { error } = await this.db
      .from("appointments")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }
}
