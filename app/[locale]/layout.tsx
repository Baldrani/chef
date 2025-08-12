import type { Metadata } from "next";
import { Poppins, Pacifico } from "next/font/google";
import "../globals.css";
import Header from "../components/Header";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "../components/Providers";

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
            <body className={`${poppins.variable} ${pacifico.variable} antialiased bg-gradient-to-br from-blue-50 via-white to-purple-50 text-slate-900 relative min-h-screen`}>
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-300/30 to-purple-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-r from-yellow-300/30 to-pink-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-r from-blue-300/30 to-purple-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                </div>
                <AuthProvider>
                    <NextIntlClientProvider messages={messages} locale={locale}>
                        <Header />
                        <Toaster richColors position="top-center" />
                        {children}
                    </NextIntlClientProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
