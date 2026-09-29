import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Cliente por request, atado a las cookies de sesión de la psicóloga
 * autenticada. Respeta Row Level Security: solo ve sus propios datos.
 */
export function getSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name: string, options: CookieOptions) => {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

/**
 * Patrón Singleton (a nivel de módulo del servidor): cliente con Service
 * Role, usado SOLO por rutas de servidor sin sesión de usuario (confirmar
 * cita por token público, guardar encuesta post-sesión, cron de
 * recordatorios). Nunca se importa en código de cliente.
 *
 * Se tipa explícitamente con <any> porque este proyecto no declara un
 * esquema `Database` generado (`supabase gen types typescript`); sin un
 * argumento de tipo explícito, supabase-js v2 infiere `never` para las
 * filas de `insert`/`update` en tablas no tipadas. Si más adelante se
 * genera el tipo `Database`, basta con pasarlo aquí en vez de `any`.
 */
let adminClient: ReturnType<typeof createClient<any>> | null = null;

export function getSupabaseAdminClient() {
  if (!adminClient) {
    adminClient = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return adminClient;
}
