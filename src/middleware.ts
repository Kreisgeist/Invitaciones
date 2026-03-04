import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Note: Next.js 16 deprecates middleware in favor of "proxy".
// This middleware still works but shows a deprecation warning.
// Auth check is done server-side in dashboard pages / API routes.
// The middleware provides a fast redirect for unauthenticated users.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
