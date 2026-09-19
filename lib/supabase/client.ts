import { createBrowserClient } from "@supabase/ssr";

// Cliente para uso en Client Components.
// Usa la anon key: solo puede hacer lo que las policies de RLS permitan.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
