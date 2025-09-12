import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/api/login", "/api/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const session = request.cookies.get("session");
  if (!session) {
    // Si no hay sesión, redirige a /login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si hay sesión, permite el acceso
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|api/test-db).*)"],
};