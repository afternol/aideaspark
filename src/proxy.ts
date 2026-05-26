import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "paint-platform.com";

// auth.js v5 のcookie名（v4から変更された）
const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

// req.nextUrl.pathname はbasePath(/aideaspark)が自動除去された相対パス
export default async function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (host !== CANONICAL_HOST && !host.startsWith("localhost")) {
    const url = req.nextUrl.clone();
    url.protocol = "https";
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, { status: 301 });
  }

  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth");

  if (!isPublic) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      cookieName: SESSION_COOKIE,
    });
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
};
