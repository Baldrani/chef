"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Header() {
    const pathname = usePathname();
    const t = useTranslations("Header");
    const locale = useLocale();
    const { data: session, status } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const base = pathname || "/";

    return (
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-lg shadow-black/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-baseline gap-2 sm:gap-3 group transition-transform hover:scale-105">
                        <span className="text-2xl sm:text-3xl bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-bold" style={{ fontFamily: "var(--font-pacifico)" }}>
                            {t("brand")}
                        </span>
                        <span className="hidden sm:block text-xs uppercase tracking-widest text-slate-500 font-medium group-hover:text-purple-600 transition-colors">{t("tag")}</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6 text-sm">
                        {session && (
                            <NavLink href="/trips" active={pathname?.startsWith(`/trips`)}>
                                {t("trips")}
                            </NavLink>
                        )}
                        
                        {/* Authentication Section */}
                        {status === "loading" ? (
                            <div className="px-4 py-2 text-slate-500">Loading...</div>
                        ) : session ? (
                            <div className="flex items-center gap-4">
                                <span className="text-slate-600 hidden lg:block">
                                    {session.user?.name || session.user?.email}
                                </span>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="px-4 py-2 rounded-full font-medium text-slate-600 hover:text-purple-600 hover:bg-white/60 hover:shadow-md hover:scale-105 transition-all duration-200"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <NavLink href="/auth/signin">
                                Sign in
                            </NavLink>
                        )}
                        
                        <div className="flex items-center gap-2 bg-slate-100/80 rounded-full px-3 py-1">
                            <LocaleLink code="en" active={locale === "en"} base={base} />
                            <span className="text-slate-400">|</span>
                            <LocaleLink code="fr" active={locale === "fr"} base={base} />
                        </div>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-white/60 transition-all"
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                            />
                        </svg>
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <nav className="md:hidden mt-4 pb-4 border-t border-white/20">
                        <div className="flex flex-col gap-3 mt-4">
                            {session && (
                                <MobileNavLink 
                                    href="/trips" 
                                    active={pathname?.startsWith(`/trips`)}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {t("trips")}
                                </MobileNavLink>
                            )}
                            
                            {/* Authentication Section */}
                            {status === "loading" ? (
                                <div className="px-4 py-2 text-slate-500">Loading...</div>
                            ) : session ? (
                                <div className="flex flex-col gap-3">
                                    <div className="px-4 py-2 text-slate-600 text-sm">
                                        {session.user?.name || session.user?.email}
                                    </div>
                                    <button
                                        onClick={() => {
                                            signOut({ callbackUrl: "/" });
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 rounded-lg font-medium text-slate-600 hover:text-purple-600 hover:bg-white/60 transition-all duration-200"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <MobileNavLink 
                                    href="/auth/signin"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Sign in
                                </MobileNavLink>
                            )}
                            
                            {/* Language Switcher */}
                            <div className="flex items-center justify-center gap-4 mt-2 pt-3 border-t border-white/20">
                                <MobileLocaleLink code="en" active={locale === "en"} base={base} onClick={() => setIsMenuOpen(false)} />
                                <MobileLocaleLink code="fr" active={locale === "fr"} base={base} onClick={() => setIsMenuOpen(false)} />
                            </div>
                        </div>
                    </nav>
                )}
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
                active ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm" : "text-slate-500 hover:text-purple-600 hover:bg-white/60"
            }`}
        >
            {code.toUpperCase()}
        </Link>
    );
}

function MobileNavLink({ href, active, children, onClick }: { href: string; active?: boolean; children: React.ReactNode; onClick?: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                active
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-slate-600 hover:text-purple-600 hover:bg-white/60"
            }`}
        >
            {children}
        </Link>
    );
}

function MobileLocaleLink({ code, active, base, onClick }: { code: string; active: boolean; base: string; onClick?: () => void }) {
    return (
        <Link
            href={base || "/"}
            locale={code}
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                active ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm" : "text-slate-500 hover:text-purple-600 hover:bg-white/60"
            }`}
        >
            {code.toUpperCase()}
        </Link>
    );
}
