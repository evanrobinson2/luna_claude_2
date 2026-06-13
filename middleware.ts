import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow API routes and login page through without auth check
  if (pathname.startsWith("/api/") || pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const password = process.env.PASSWORD;
  if (!password) {
    // If no PASSWORD env var is set, allow access (dev convenience)
    return NextResponse.next();
  }

  const authCookie = req.cookies.get("luna_auth");

  if (!authCookie || authCookie.value !== password) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
