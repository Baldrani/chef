import { withAuth } from "next-auth/middleware";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Normalize auth pages to include locale (redirect /auth/* -> /{defaultLocale}/auth/*)
    if (pathname.startsWith("/auth/")) {
      const locale = routing.defaultLocale;
      const rest = pathname.replace(/^\/auth\//, "auth/");
      return NextResponse.redirect(new URL(`/${locale}/${rest}${req.nextUrl.search}`, req.url));
    }

    // Skip intl middleware for API routes
    if (pathname.startsWith("/api/")) {
      return;
    }

    // Run the intl middleware for non-API requests
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const publicPaths = [
          "/",
          "/auth/signin",
          "/auth/error",
          "/join",
          "/associate",
          "/api/auth",
        ];

        const { pathname } = req.nextUrl;
        const pathWithoutLocale = pathname.replace(/^\/[a-zA-Z]{2}(\/|$)/, "/");

        if (publicPaths.some(path => pathWithoutLocale.startsWith(path))) {
          return true;
        }

        return !!token;
      },
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
  }
);

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
