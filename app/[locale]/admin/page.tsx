"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { formatHumanDate } from "@/lib/dates";
import Loader from "@/app/components/Loader";

type Trip = {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
};

export default function AdminPage() {
    const t = useTranslations("Admin");
    const locale = useLocale();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLoadingTrips, setIsLoadingTrips] = useState(true);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            setIsLoadingTrips(true);
            try {
                const res = await fetch("/api/trips", { cache: "no-store" });
                const data = await res.json();
                setTrips(data);
            } finally {
                setIsLoadingTrips(false);
            }
        })();
    }, []);

    async function createTrip() {
        if (!name || !startDate || !endDate) return;
        setLoading(true);
        try {
            const res = await fetch("/api/trips", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name,
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                }),
            });
            const trip = await res.json();
            setTrips(tl => [trip, ...tl]);
            setName("");
            setStartDate("");
            setEndDate("");
            router.push(`/trips/${trip.id}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-bold animate-gradient">
                    {t("title")}
                </h1>
                <p className="text-xl text-slate-600 font-medium">Manage your cooking adventures</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">{t("create")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input className="input" placeholder={t("name")} value={name} onChange={e => setName(e.target.value)} />
                    <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} aria-label={t("start")} />
                    <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} aria-label={t("end")} />
                </div>
                <button className="btn btn-primary disabled:opacity-50" disabled={loading || !name || !startDate || !endDate} onClick={createTrip}>
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader size="sm" />
                            {t("creating")}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {t("createBtn")}
                        </div>
                    )}
                </button>
            </div>

            {isLoadingTrips ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl">
                    <Loader text="Loading trips..." className="py-8" />
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-800">Your Trips</h2>
                    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trips.map(trip => (
                            <li key={trip.id} className="card card-interactive group">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xl font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                                            {trip.name}
                                        </div>
                                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {formatHumanDate(trip.startDate, locale)} → {formatHumanDate(trip.endDate, locale)}
                                        </div>
                                    </div>
                                    <button 
                                        className="btn btn-primary w-full group-hover:scale-105 transition-transform" 
                                        onClick={() => router.push(`/trips/${trip.id}`)}
                                    >
                                        <div className="flex items-center gap-2 justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            {t("open")}
                                        </div>
                                    </button>
                                </div>
                            </li>
                        ))}
                        {trips.length === 0 && (
                            <li className="col-span-full bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-white/50 shadow-lg text-center">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-700">No trips yet</h3>
                                        <p className="text-slate-500 mt-1">Create your first trip above to get started!</p>
                                    </div>
                                </div>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
