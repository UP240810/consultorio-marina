import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Patrón Singleton: una sola instancia del cliente de Supabase para el
 * navegador, reutilizada por todos los componentes cliente.
 */
let browserClient: SupabaseClient<any> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<any> {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ) as SupabaseClient<any>;
  }
  return browserClient;
}
