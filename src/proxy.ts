import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedFromRequest } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (isAdminRoute && !isLoginPage) {
    const authed = await isAuthenticatedFromRequest(request);
    if (!authed) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (isLoginPage) {
    const authed = await isAuthenticatedFromRequest(request);
    if (authed) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
