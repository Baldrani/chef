import type { Metadata } from "next";
import "../globals.css";
import Header from "../components/Header";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AllProviders } from "../components/Providers";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    
    const translations = {
        en: {
            title: 'Chef - Stress-free Group Cooking on Vacation | Plan Meals, Assign Cooks, Generate Grocery Lists',
            description: 'Plan vacation meals, fairly assign cooks and helpers, add recipes, and get AI-generated daily grocery lists. Free, open-source meal planning for vacation rentals and group trips.',
        },
        fr: {
            title: 'Chef - Cuisine de Groupe Sans Stress en Vacances | Planifier les Repas, Assigner les Cuisiniers',
            description: 'Planifiez les repas de vacances, assignez équitablement les cuisiniers et assistants, ajoutez des recettes et obtenez des listes de courses générées par IA. Gratuit et open-source.',
        }
    };

    const t = translations[locale as keyof typeof translations] || translations.en;

    return {
        title: t.title,
        description: t.description,
        alternates: {
            canonical: `/${locale}`,
            languages: {
                'en-US': '/en',
                'fr-FR': '/fr',
                'x-default': '/en',
            },
        },
        openGraph: {
            title: t.title,
            description: t.description,
            url: `/${locale}`,
            locale: locale === 'fr' ? 'fr_FR' : 'en_US',
            alternateLocale: locale === 'fr' ? ['en_US'] : ['fr_FR'],
        },
    };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    if (!(routing.locales as readonly string[]).includes(locale)) {
        notFound();
    }
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return (
        <div className="relative min-h-screen">
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-300/30 to-purple-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-r from-yellow-300/30 to-pink-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-r from-blue-300/30 to-purple-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>
            <AllProviders>
                <NextIntlClientProvider messages={messages} locale={locale}>
                    <Header />
                    <Toaster richColors position="top-center" />
                    {children}
                </NextIntlClientProvider>
            </AllProviders>
        </div>
    );
}
