"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function Header() {
    const pathname = usePathname();
    const t = useTranslations("Header");
    const locale = useLocale();

    const base = pathname?.split("/").slice(2).join("/") || ""; // strip leading /{locale}

    return (
        <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href={`/${locale}`} className="flex items-baseline gap-2">
                    <span className="text-2xl" style={{ fontFamily: "var(--font-pacifico)" }}>
                        {t("brand")}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-slate-700">{t("tag")}</span>
                </Link>
                <nav className="flex items-center gap-4 text-sm">
                    <NavLink href={`/${locale}/admin`} active={pathname?.startsWith(`/${locale}/admin`)}>
                        {t("admin")}
                    </NavLink>
                    <a className="hover:text-black" href="https://github.com" target="_blank" rel="noreferrer">
                        {t("github")}
                    </a>
                    <div className="flex items-center gap-1">
                        <LocaleLink code="en" active={locale === "en"} base={base} />
                        <span>/</span>
                        <LocaleLink code="fr" active={locale === "fr"} base={base} />
                    </div>
                </nav>
            </div>
        </header>
    );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
    return (
        <Link href={href} className={`px-2 py-1 rounded ${active ? "bg-white/70 shadow-sm" : "hover:underline"}`}>
            {children}
        </Link>
    );
}

function LocaleLink({ code, active, base }: { code: string; active: boolean; base: string }) {
    const path = `/${code}/${base}`.replace(/\/$/, "");
    return (
        <Link href={path || `/${code}`} className={`px-2 py-1 rounded ${active ? "bg-white/70 shadow-sm" : "hover:underline"}`}>
            {code.toUpperCase()}
        </Link>
    );
}
