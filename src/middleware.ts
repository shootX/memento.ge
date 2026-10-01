import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const requestHeaders = new Headers(request.headers);
  if (request.nextUrl.searchParams.get("pwa_install_demo") === "1") {
    requestHeaders.set("x-memento-pwa-demo", "install");
  } else if (request.nextUrl.searchParams.get("pwa_ios_demo") === "1") {
    requestHeaders.set("x-memento-pwa-demo", "ios");
  }
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", buildCsp(isDev));
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=()",
  );

  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  const hostMatch = request.nextUrl.pathname.match(/^\/host\/([A-Za-z0-9_-]{24,128})(?:\/|$)/);
  if (hostMatch && !request.nextUrl.pathname.includes("/slideshow")) {
    response.cookies.set("memento_host_csrf", hostMatch[1], {
      httpOnly: true,
      secure: !isDev,
      sameSite: "strict",
      path: "/",
      maxAge: 24 * 3600,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|icons/|manifest.webmanifest).*)",
  ],
};
