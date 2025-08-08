import createMiddleware from "next-intl/middleware";

export default createMiddleware({
    locales: ["en", "fr"],
    defaultLocale: "en",
    // Per docs, with middleware you don't need a separate config file; we add the request config file in i18n/request.ts
});

export const config = {
    matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
