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
        <html>
            <body className={`${poppins.variable} ${pacifico.variable} antialiased bg-[#f8fafc] text-slate-900 relative`}>{children}</body>
        </html>
    );
}
