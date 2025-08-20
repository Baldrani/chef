import type { Metadata } from "next";
import { Poppins, Pacifico } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body className={`${poppins.variable} ${pacifico.variable} antialiased bg-gradient-to-br from-blue-50 via-white to-purple-50 text-slate-900 relative min-h-screen`}>{children}</body>
        </html>
    );
}
