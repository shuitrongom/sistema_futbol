import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes - only admin
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Coach routes - only coach (admin cannot enter coach panel)
    if (pathname.startsWith("/coach") && token?.role !== "coach") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Parent routes - only parent (admin cannot enter parent panel)
    if (pathname.startsWith("/parent") && token?.role !== "parent") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Player routes - only player
    if (pathname.startsWith("/player") && token?.role !== "player") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/coach/:path*", "/parent/:path*", "/player/:path*"],
};
