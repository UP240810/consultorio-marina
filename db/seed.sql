-- Datos de ejemplo opcionales para probar la app en desarrollo.
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de crear tu usuario
-- (auth.users) y de correr schema.sql. Sustituye '<TU_USER_ID>' por el
-- UUID de tu usuario (Authentication > Users en el dashboard de Supabase).

insert into profiles (id, full_name, professional_license, masters_license, specialty)
values ('<TU_USER_ID>', 'Marina Velázquez Tristán', '13619201', '9718535',
        'Psicología Cognitivo-Conductual | Terapia Gestalt')
on conflict (id) do nothing;

insert into patients (doctor_id, full_name, birth_date, occupation, phone, email,
                       emergency_contact_name, emergency_contact_phone, current_medication, status)
values
  ('<TU_USER_ID>', 'Ana Sofía Ramírez López', '2001-03-14', 'Estudiante', '449-123-4567',
   'ana.ramirez@example.com', 'Laura Ramírez', '449-765-4321', 'Ninguna', 'activo'),
  ('<TU_USER_ID>', 'Diego Hernández Ruiz', '1995-07-02', 'Contador', '449-234-5678',
   'diego.hernandez@example.com', 'Marta Ruiz', '449-876-5432', 'Sertralina 50mg', 'activo');
