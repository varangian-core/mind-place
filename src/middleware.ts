import { auth } from "next-auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const protectedRoutes = ["/dashboard", "/profile"];
  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (!req.auth && isProtected) {
    const signInUrl = new URL("/login", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
