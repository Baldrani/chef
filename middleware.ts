import { withAuth } from "next-auth/middleware"
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    
    // Skip intl middleware for API routes
    if (pathname.startsWith('/api/')) {
      return;
    }
    
    // Run the intl middleware for non-API requests
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public routes that don't require authentication
        const publicPaths = [
          "/", 
          "/auth/signin", 
          "/auth/error",
          "/join", // For invite acceptance
          "/api/auth", // NextAuth API routes
        ];
        
        const { pathname } = req.nextUrl;
        
        // Remove locale prefix for checking
        const pathWithoutLocale = pathname.replace(/^\/[a-zA-Z]{2}(\/|$)/, "/");
        
        // Allow public paths
        if (publicPaths.some(path => pathWithoutLocale.startsWith(path))) {
          return true;
        }
        
        // Require authentication for all other routes
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
  matcher: [
    // Match all paths except static files and Next.js internals
    // Include API routes for authentication but handle intl separately
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
