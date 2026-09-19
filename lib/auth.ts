import "server-only";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Lanza si el usuario autenticado actual no está en ADMIN_EMAILS.
 * Se llama al inicio de cada Server Action de /admin, además de la
 * protección que ya hace middleware.ts sobre las rutas /admin/*.
 */
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  if (!isAdmin) {
    throw new Error("No autorizado.");
  }

  return user;
}
