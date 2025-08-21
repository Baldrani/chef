"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import Button from "@/app/components/Button";
import Script from "next/script";

export default function Home() {
    const t = useTranslations("Home");
    const router = useRouter();
    const [token, setToken] = useState("");

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://chef-app.vercel.app'}/#organization`,
                "name": "Chef",
                "url": process.env.NEXT_PUBLIC_BASE_URL || 'https://chef-app.vercel.app',
                "logo": {
                    "@type": "ImageObject",
                    "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://chef-app.vercel.app'}/logo.png`,
                    "width": 512,
                    "height": 512
                },
                "description": "Free, open-source meal planning for vacation rentals and group trips",
                "founder": {
                    "@type": "Person",
                    "name": "Maël Mayon",
                    "url": "https://github.com/Baldrani"
                },
                "foundingDate": "2024",
                "contactPoint": {
                    "@type": "ContactPoint",
                    "contactType": "technical support",
                    "url": "https://github.com/Baldrani/chef/issues"
                }
            },
            {
                "@type": "WebSite",
                "@id": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://chef-app.vercel.app'}/#website`,
                "url": process.env.NEXT_PUBLIC_BASE_URL || 'https://chef-app.vercel.app',
                "name": "Chef - Vacation Meal Planning",
                "description": "Plan vacation meals, fairly assign cooks and helpers, add recipes, and get AI-generated daily grocery lists.",
                "publisher": {
                    "@id": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://chef-app.vercel.app'}/#organization`
                },
                "inLanguage": ["en-US", "fr-FR"]
            },
            {
                "@type": "SoftwareApplication",
                "name": "Chef",
                "applicationCategory": "LifestyleApplication",
                "operatingSystem": "Web Browser",
                "description": "Stress-free group cooking on vacation. Plan meals, assign cooks fairly, and get AI-generated grocery lists.",
                "url": process.env.NEXT_PUBLIC_BASE_URL || 'https://chef-app.vercel.app',
                "author": {
                    "@id": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://chef-app.vercel.app'}/#organization`
                },
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock"
                },
                "featureList": [
                    "Smart meal scheduling",
                    "Fair cook assignment algorithm", 
                    "Recipe management",
                    "AI-generated grocery lists",
                    "Multi-language support",
                    "Vacation rental integration",
                    "Calendar export (ICS)"
                ]
            }
        ]
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Script
                id="structured-data"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData)
                }}
            />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden py-20 lg:py-28">
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-orange-200/40 to-red-200/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-r from-cyan-200/40 to-blue-200/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-purple-200/40 to-pink-200/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-8">
                        {/* Main Headline */}
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full px-4 py-2 text-sm font-medium text-purple-700 mb-6">
                                <span className="text-lg">🏖️</span>
                                Perfect for vacation rentals
                            </div>
                            
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
                                {t("headline")}
                            </h1>
                            
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                                {t("sub")}
                            </p>
                        </div>

                        {/* CTA Section */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                            <Button 
                                href="/trips" 
                                variant="primary" 
                                size="lg"
                                className="w-full sm:w-auto"
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                }
                            >
                                {t("createTrip")}
                            </Button>
                            
                            <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto">
                                <input
                                    className="input w-full sm:w-72 placeholder:text-slate-400 text-center sm:text-left"
                                    placeholder={t("joinPlaceholder")}
                                    value={token}
                                    onChange={e => setToken(e.target.value)}
                                />
                                <Button 
                                    variant="secondary" 
                                    size="lg"
                                    className="w-full sm:w-auto"
                                    onClick={() => token && router.push(`/join/${token}`)}
                                    disabled={!token.trim()}
                                    icon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                    }
                                >
                                    {t("join")}
                                </Button>
                            </div>
                        </div>

                        {/* Trust Indicators */}
                        <div className="pt-12">
                            <p className="text-sm text-slate-500 mb-6">Trusted by vacation groups worldwide</p>
                            <div className="flex items-center justify-center gap-8 opacity-60">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <span className="text-green-500">✓</span> Free & Open Source
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <span className="text-green-500">✓</span> No Registration Required
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <span className="text-green-500">✓</span> Privacy Focused
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 bg-white/30 backdrop-blur-sm">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">
                                Everything you need for <span className="text-purple-600">group cooking</span>
                            </h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                From meal planning to grocery shopping, we&apos;ve got you covered with smart automation and fair scheduling.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Feature 
                                icon="🎯"
                                title={t("f1.title")} 
                                desc={t("f1.desc")}
                                delay="0"
                            />
                            <Feature 
                                icon="📋"
                                title={t("f2.title")} 
                                desc={t("f2.desc")}
                                delay="200"
                            />
                            <Feature 
                                icon="🔗"
                                title={t("f3.title")} 
                                desc={t("f3.desc")}
                                delay="400"
                            />
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-20">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">
                                How it works
                            </h2>
                            <p className="text-lg text-slate-600">
                                Get your group cooking organized in just a few simple steps
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <Step 
                                number="1"
                                title="Create Trip"
                                desc="Set dates and invite your group members"
                                icon="🏝️"
                            />
                            <Step 
                                number="2"
                                title="Add Preferences"
                                desc="Everyone sets their cooking preferences and availability"
                                icon="⚙️"
                            />
                            <Step 
                                number="3"
                                title="Smart Scheduling"
                                desc="Our algorithm assigns cooks and helpers fairly"
                                icon="🤖"
                            />
                            <Step 
                                number="4"
                                title="Shop & Cook"
                                desc="Get daily grocery lists and enjoy stress-free meals"
                                icon="🍳"
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-slate-50 border-t border-slate-200">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Ready to organize your next trip?
                        </h2>
                        <p className="text-lg text-slate-600">
                            Join thousands of groups who have made vacation cooking stress-free
                        </p>
                        <Button 
                            href="/trips" 
                            variant="primary"
                            size="lg"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            }
                        >
                            Start Planning Now
                        </Button>
                    </div>
                </section>
            </main>

            <footer className="bg-slate-900 text-slate-300 py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold px-0.5" style={{ fontFamily: "var(--font-pacifico)" }}>
                                    Chef
                                </span>
                                <span className="text-xs uppercase tracking-widest text-slate-500">Summer</span>
                            </div>
                            <p className="text-sm text-slate-400">
                                Making group cooking on vacation stress-free and fair for everyone.
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link href="/trips" className="hover:text-white transition-colors">Create Trip</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">How it Works</Link></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="https://github.com/Baldrani/chef" className="hover:text-white transition-colors">Documentation</a></li>
                                <li><a href="https://github.com/Baldrani/chef/issues" className="hover:text-white transition-colors">Report Issues</a></li>
                                <li><a href="https://github.com/Baldrani/chef" className="hover:text-white transition-colors">GitHub</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                                <li><a href="https://github.com/Baldrani/chef/blob/main/LICENSE" className="hover:text-white transition-colors">License</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-slate-700 pt-8 flex flex-col sm:flex-row justify-between items-center">
                        <div className="text-sm text-slate-400">
                            {t.rich("footer", { 
                                year: new Date().getFullYear(), 
                                name: (name) => <a href="https://github.com/Baldrani" className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:from-pink-400 hover:to-purple-400 transition-all duration-300 font-medium">{name}</a>
                            })}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-4 sm:mt-0">
                            <a href="https://github.com/Baldrani/chef" className="text-slate-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function Feature({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: string }) {
    return (
        <div className={`card-feature group hover:scale-105 transition-all duration-300 slide-in-up`} style={{ animationDelay: `${delay}ms` }}>
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-purple-600 transition-colors">
                {title}
            </h3>
            <p className="text-slate-600 leading-relaxed">
                {desc}
            </p>
        </div>
    );
}

function Step({ number, title, desc, icon }: { number: string; title: string; desc: string; icon: string }) {
    return (
        <div className="text-center group">
            <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-white-300 to-fuchsia-300 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                    {number}
                </div>
                <div className="absolute -top-2 -right-2 text-4xl group-hover:animate-bounce">
                    {icon}
                </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                {title}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
                {desc}
            </p>
        </div>
    );
}
