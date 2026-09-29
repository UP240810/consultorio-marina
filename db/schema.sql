
create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Marina Velázquez Tristán',
  professional_license text not null default '13619201',
  masters_license text default '9718535',
  specialty text default 'Psicología Cognitivo-Conductual | Terapia Gestalt',
  created_at timestamptz not null default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users (id) default auth.uid(),
  full_name text not null,
  birth_date date,
  occupation text,
  phone text not null,
  email text,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  current_medication text,
  status text not null default 'activo' check (status in ('activo', 'de_alta', 'pausado')),
  intake_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patients_doctor on patients (doctor_id);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users (id) default auth.uid(),
  patient_id uuid not null references patients (id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 50,
  status text not null default 'agendada'
    check (status in ('agendada', 'confirmada', 'cancelada', 'completada', 'no_asistio')),
  confirm_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  reminder_sent_at timestamptz,
  price numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  constraint chk_business_hours check (
    extract(hour from scheduled_at at time zone 'America/Mexico_City') >= 8
    and extract(hour from scheduled_at at time zone 'America/Mexico_City') < 20
  )
);

create index if not exists idx_appointments_doctor on appointments (doctor_id);
create index if not exists idx_appointments_patient on appointments (patient_id);
create index if not exists idx_appointments_date on appointments (scheduled_at);
create unique index if not exists idx_appointments_token on appointments (confirm_token);

create table if not exists session_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments (id) on delete set null,
  patient_id uuid not null references patients (id) on delete cascade,
  doctor_id uuid not null references auth.users (id) default auth.uid(),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_notes_patient on session_notes (patient_id);

create table if not exists session_surveys (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments (id) on delete cascade,
  patient_id uuid not null references patients (id) on delete cascade,
  doctor_id uuid not null references auth.users (id) default auth.uid(),
  mood_answers jsonb not null default '{}'::jsonb,
  discharge_readiness smallint not null check (discharge_readiness between 1 and 10),
  risk_factor boolean not null default false,
  risk_factor_detail text,
  emergency_contact_notified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_surveys_patient on session_surveys (patient_id);
create index if not exists idx_surveys_risk on session_surveys (risk_factor) where risk_factor = true;

create table if not exists finance_entries (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users (id) default auth.uid(),
  kind text not null check (kind in ('ingreso', 'gasto')),
  concept text not null,
  amount numeric(10, 2) not null check (amount >= 0),
  appointment_id uuid references appointments (id) on delete set null,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_doctor_date on finance_entries (doctor_id, entry_date);

create table if not exists issued_documents (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users (id) default auth.uid(),
  patient_id uuid not null references patients (id) on delete cascade,
  document_type text not null
    check (document_type in ('justificante', 'constancia', 'permiso_escolar')),
  period_start date,
  period_end date,
  diagnosis_text text,
  custom_reason text,
  file_path text,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_patient on issued_documents (patient_id);

create table if not exists reminder_logs (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments (id) on delete cascade,
  channel text not null default 'email' check (channel in ('email', 'sms', 'whatsapp')),
  status text not null check (status in ('enviado', 'fallido')),
  detail text,
  sent_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table session_notes enable row level security;
alter table session_surveys enable row level security;
alter table finance_entries enable row level security;
alter table issued_documents enable row level security;
alter table reminder_logs enable row level security;

create policy "profiles: dueña ve su perfil" on profiles
  for select using (auth.uid() = id);
create policy "profiles: dueña edita su perfil" on profiles
  for update using (auth.uid() = id);

create policy "patients: solo la doctora dueña" on patients
  for all using (auth.uid() = doctor_id) with check (auth.uid() = doctor_id);

create policy "appointments: solo la doctora dueña" on appointments
  for all using (auth.uid() = doctor_id) with check (auth.uid() = doctor_id);

create policy "session_notes: solo la doctora dueña" on session_notes
  for all using (auth.uid() = doctor_id) with check (auth.uid() = doctor_id);

create policy "session_surveys: solo la doctora dueña" on session_surveys
  for all using (auth.uid() = doctor_id) with check (auth.uid() = doctor_id);

create policy "finance_entries: solo la doctora dueña" on finance_entries
  for all using (auth.uid() = doctor_id) with check (auth.uid() = doctor_id);

create policy "issued_documents: solo la doctora dueña" on issued_documents
  for all using (auth.uid() = doctor_id) with check (auth.uid() = doctor_id);

create policy "reminder_logs: solo via appointment de la doctora" on reminder_logs
  for select using (
    exists (
      select 1 from appointments a
      where a.id = reminder_logs.appointment_id and a.doctor_id = auth.uid()
    )
  );

