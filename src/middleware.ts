import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "sanmin_session";

async function getPayload(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    return payload as { role?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const payload = await getPayload(req);

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!payload) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/admin") && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/work", req.url));
    }
    if (pathname.startsWith("/dashboard") && payload.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  if (
    (pathname === "/login" || pathname === "/register") &&
    payload
  ) {
    const dest =
      payload.role === "ADMIN" ? "/admin" : "/dashboard/work";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
