import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "./server/auth/config";

import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isMainPage = request.nextUrl.pathname === "/";
  const isAuthPage = request.nextUrl.pathname.startsWith("/api/auth");
  const isPngFile = request.nextUrl.pathname.endsWith(".png");

  // Allow access to main page, auth-related routes, and PNG files
  if (isMainPage || isAuthPage || isPngFile) {
    return NextResponse.next();
  }

  // If not authenticated and not on main page, redirect to sign in
  if (!session) {
    const signInUrl = new URL("/api/auth/signin", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
