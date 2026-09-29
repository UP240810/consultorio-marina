import { createBrowserClient } from "@supabase/ssr";

/**
 * Patrón Singleton: una sola instancia del cliente de Supabase para el
 * navegador, reutilizada por todos los componentes cliente.
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
