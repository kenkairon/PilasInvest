import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la service_role key: IGNORA por completo las policies de RLS.
 * Úsalo SOLO dentro de código servidor que ya haya verificado con requireAdmin()
 * que quien llama es un administrador autenticado. Nunca lo importes desde un
 * Client Component ni expongas SUPABASE_SERVICE_ROLE_KEY con el prefijo NEXT_PUBLIC_.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
