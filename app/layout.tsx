import type { Metadata } from "next";
import { Poppins, Pacifico } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
    variable: "--font-poppins",
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
    display: "swap",
    preload: true,
});

const pacifico = Pacifico({
    variable: "--font-pacifico",
    weight: "400",
    subsets: ["latin"],
    display: "swap",
    preload: true,
});

export const metadata: Metadata = {
    title: {
        template: '%s | Chef - Stress-free Group Cooking',
        default: 'Chef - Stress-free Group Cooking on Vacation | Plan Meals, Assign Cooks, Generate Grocery Lists'
    },
    description: "Plan vacation meals, fairly assign cooks and helpers, add recipes, and get AI-generated daily grocery lists. Free, open-source meal planning for vacation rentals and group trips.",
    keywords: [
        "vacation meal planning",
        "group cooking",
        "meal scheduler",
        "vacation rental cooking",
        "group trip meals",
        "cooking assignments",
        "grocery list generator",
        "vacation cooking app",
        "meal planning software",
        "group vacation planner"
    ],
    authors: [{ name: "Maël Mayon", url: "https://github.com/Baldrani" }],
    creator: "Maël Mayon",
    publisher: "Chef App",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://chef-app.vercel.app'),
    alternates: {
        canonical: '/',
        languages: {
            'en-US': '/en',
            'fr-FR': '/fr',
        },
    },
    openGraph: {
        title: 'Chef - Stress-free Group Cooking on Vacation',
        description: 'Plan vacation meals, fairly assign cooks and helpers, add recipes, and get AI-generated daily grocery lists. Perfect for vacation rentals and group trips.',
        url: '/',
        siteName: 'Chef',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Chef - Vacation meal planning made easy',
            },
        ],
        locale: 'en_US',
        alternateLocale: ['fr_FR'],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Chef - Stress-free Group Cooking on Vacation',
        description: 'Plan vacation meals, assign cooks fairly, and get AI-generated grocery lists. Free & open-source.',
        images: ['/twitter-image.png'],
        creator: '@baldrani',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
        yandex: process.env.YANDEX_VERIFICATION,
        yahoo: process.env.YAHOO_VERIFICATION,
        other: {
            me: ['mailto:contact@chef-app.com'],
        },
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="color-scheme" content="light" />
                <meta name="theme-color" content="#f8fafc" />
            </head>
            <body className={`${poppins.variable} ${pacifico.variable} antialiased bg-gradient-to-br from-blue-50 via-white to-purple-50 text-slate-900 relative min-h-screen`}>{children}</body>
        </html>
    );
}
