import type { SupabaseClient } from "@supabase/supabase-js";
import type { Patient } from "@/types";

/**
 * Patrón Repository: separa la lógica de acceso a datos (Supabase) del
 * resto de la aplicación. Los componentes y rutas API dependen de esta
 * interfaz, no de detalles de la base de datos.
 */
export interface IPatientRepository {
  findAll(): Promise<Patient[]>;
  findById(id: string): Promise<Patient | null>;
  create(data: Omit<Patient, "id" | "doctor_id" | "created_at" | "updated_at">): Promise<Patient>;
  update(id: string, data: Partial<Patient>): Promise<Patient>;
}

export class SupabasePatientRepository implements IPatientRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findAll(): Promise<Patient[]> {
    const { data, error } = await this.db
      .from("patients")
      .select("*")
      .order("full_name", { ascending: true });
    if (error) throw error;
    return data as Patient[];
  }

  async findById(id: string): Promise<Patient | null> {
    const { data, error } = await this.db
      .from("patients")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Patient | null;
  }

  async create(
    data: Omit<Patient, "id" | "doctor_id" | "created_at" | "updated_at">
  ): Promise<Patient> {
    const { data: created, error } = await this.db
      .from("patients")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created as Patient;
  }

  async update(id: string, data: Partial<Patient>): Promise<Patient> {
    const { data: updated, error } = await this.db
      .from("patients")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return updated as Patient;
  }
}
