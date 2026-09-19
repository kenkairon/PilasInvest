import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const isAdmin =
    !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  if (isLoginPage) {
    // Si ya está logueado como admin, no tiene sentido ver el login de nuevo.
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return supabaseResponse;
  }

  // Cualquier otra ruta bajo /admin requiere sesión de administrador.
  if (!isAdmin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
