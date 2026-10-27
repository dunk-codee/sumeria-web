import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session";

/**
 * Protege /admin y /api/admin. Es un chequeo optimista: cada Server Action
 * y Route Handler del panel vuelve a validar la sesión.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/admin/login") {
    return session ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next();
  }
  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const url = new URL("/admin/login", request.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
