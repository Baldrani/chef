import type { Metadata } from "next";
import { Poppins, Pacifico } from "next/font/google";
import "../globals.css";
import Header from "../components/Header";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

const poppins = Poppins({
    variable: "--font-poppins",
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
    display: "swap",
});

const pacifico = Pacifico({
    variable: "--font-pacifico",
    weight: "400",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Chef",
    description: "Stress-free group cooking on vacation",
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    if (!(routing.locales as readonly string[]).includes(locale)) {
        notFound();
    }
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return (
        <html lang={locale}>
            <body className={`${poppins.variable} ${pacifico.variable} antialiased bg-[#f8fafc] text-slate-900 relative`}>
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_50%_-10%,var(--accent-start)_0%,transparent_50%),radial-gradient(50%_40%_at_120%_10%,var(--accent-mid)_0%,transparent_50%),radial-gradient(50%_40%_at_-20%_20%,var(--accent-end)_0%,transparent_50%)]" />
                <NextIntlClientProvider messages={messages} locale={locale}>
                    <Header />
                    {children}
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
