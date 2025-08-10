"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function Header() {
    const pathname = usePathname();
    const t = useTranslations("Header");
    const locale = useLocale();

    const base = pathname || "/";

    return (
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-lg shadow-black/5">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-baseline gap-3 group transition-transform hover:scale-105">
                    <span 
                        className="text-3xl bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-bold" 
                        style={{ fontFamily: "var(--font-pacifico)" }}
                    >
                        {t("brand")}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-slate-500 font-medium group-hover:text-purple-600 transition-colors">
                        {t("tag")}
                    </span>
                </Link>
                <nav className="flex items-center gap-6 text-sm">
                    <NavLink href="/admin" active={pathname?.startsWith(`/admin`)}>
                        {t("admin")}
                    </NavLink>
                    <a 
                        className="text-slate-600 hover:text-purple-600 transition-all duration-200 hover:scale-105 font-medium" 
                        href="https://github.com/Baldrani" 
                        target="_blank" 
                        rel="noreferrer"
                    >
                        {t("github")}
                    </a>
                    <div className="flex items-center gap-2 bg-slate-100/80 rounded-full px-3 py-1">
                        <LocaleLink code="en" active={locale === "en"} base={base} />
                        <span className="text-slate-400">|</span>
                        <LocaleLink code="fr" active={locale === "fr"} base={base} />
                    </div>
                </nav>
            </div>
        </header>
    );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
    return (
        <Link 
            href={href} 
            className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                active 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25" 
                    : "text-slate-600 hover:text-purple-600 hover:bg-white/60 hover:shadow-md hover:scale-105"
            }`}
        >
            {children}
        </Link>
    );
}

function LocaleLink({ code, active, base }: { code: string; active: boolean; base: string }) {
    return (
        <Link 
            href={base || "/"} 
            locale={code} 
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                active 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm" 
                    : "text-slate-500 hover:text-purple-600 hover:bg-white/60"
            }`}
        >
            {code.toUpperCase()}
        </Link>
    );
}
