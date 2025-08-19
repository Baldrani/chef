"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";

export default function Home() {
    const t = useTranslations("Home");
    const router = useRouter();
    const [token, setToken] = useState("");

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1">
                <section className="relative overflow-hidden">
                    <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center space-y-6">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{t("headline")}</h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t("sub")}</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link className="btn btn-primary px-5 py-3" href="/trips">
                                {t("createTrip")}
                            </Link>
                            <div className="flex items-stretch gap-2">
                                <input
                                    className="input w-64 placeholder:text-slate-400"
                                    placeholder={t("joinPlaceholder")}
                                    value={token}
                                    onChange={e => setToken(e.target.value)}
                                />
                                <button className="btn btn-secondary" onClick={() => token && router.push(`/join/${token}`)}>
                                    {t("join")}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-6 py-12">
                    <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
                        <Feature title={t("f1.title")} desc={t("f1.desc")} />
                        <Feature title={t("f2.title")} desc={t("f2.desc")} />
                        <Feature title={t("f3.title")} desc={t("f3.desc")} />
                    </div>
                </section>
            </main>

            <footer className="px-6 py-8 border-t bg-white/50 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto text-sm text-slate-600">
                    {t.rich("footer", { 
                        year: new Date().getFullYear(), 
                        name: (name) => <a href="https://github.com/Baldrani" className="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent hover:from-purple-500 hover:to-red-500 transition-all duration-300">{name}</a>
                    })}
                </div>
            </footer>
        </div>
    );
}

function Feature({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="card">
            <div className="font-medium mb-1">{title}</div>
            <div className="text-slate-600 text-sm">{desc}</div>
        </div>
    );
}
