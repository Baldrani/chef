"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { formatHumanDate } from "@/lib/dates";
import Loader from "@/app/components/Loader";
import { api } from "@/lib/api-client";

type Trip = {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
};

export default function AdminPage() {
    const { data: session, status } = useSession();
    const t = useTranslations("Admin");
    const locale = useLocale();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLoadingTrips, setIsLoadingTrips] = useState(true);
    const router = useRouter();

    // Redirect if not authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        }
    }, [status, router]);

    // Load trips when authenticated
    useEffect(() => {
        if (session) {
            (async () => {
                setIsLoadingTrips(true);
                try {
                    const res = await api.get("/api/trips", { cache: "no-store" });
                    if (res.ok) {
                        const data = await res.json();
                        setTrips(Array.isArray(data) ? data : []);
                    } else {
                        console.error("Failed to fetch trips:", res.status);
                        setTrips([]);
                    }
                } catch (error) {
                    console.error("Error fetching trips:", error);
                    setTrips([]);
                } finally {
                    setIsLoadingTrips(false);
                }
            })();
        }
    }, [session]);

    // Show loading spinner while checking authentication
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader text="Loading..." />
            </div>
        );
    }

    // Don't render anything if not authenticated (will redirect)
    if (!session) {
        return null;
    }

    async function createTrip() {
        if (!name || !startDate || !endDate) return;
        setLoading(true);
        try {
            const res = await api.post("/api/trips", {
                name,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
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

    async function deleteTrip(tripId: string, tripName: string) {
        if (!confirm(`Are you sure you want to delete "${tripName}"? This will permanently delete all participants, meals, recipes, and data for this trip. This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await api.delete(`/api/trips/${tripId}`);
            if (res.ok) {
                setTrips(trips => trips.filter(t => t.id !== tripId));
            } else {
                const error = await res.json();
                alert(`Failed to delete trip: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error deleting trip:", error);
            alert("Failed to delete trip. Please try again.");
        }
    }

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 sm:space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-bold animate-gradient h-16">
                    {t("title")}
                </h1>
                <p className="text-xl text-slate-600 font-medium">{t("tagline")}</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">{t("create")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input className="input w-full" placeholder={t("name")} value={name} onChange={e => setName(e.target.value)} />
                    <input className="input w-full" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} aria-label={t("start")} />
                    <input className="input w-full" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} aria-label={t("end")} />
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
                    <Loader text={t("loadingTrips")} className="py-8" />
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-800">{t("yourTrips")}</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {Array.isArray(trips) && trips.map(trip => (
                            <li key={trip.id} className="card card-interactive group" onClick={() => router.push(`/trips/${trip.id}`)}>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                                            {trip.name}
                                        </div>
                                        <div className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="truncate">
                                                {formatHumanDate(trip.startDate, locale)} → {formatHumanDate(trip.endDate, locale)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button 
                                            className="btn btn-primary flex-1 group-hover:scale-105 transition-transform"
                                        >
                                            <div className="flex items-center gap-2 justify-center">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                                {t("open")}
                                            </div>
                                        </button>
                                        <button 
                                            className="btn btn-secondary hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors px-3 sm:flex-shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteTrip(trip.id, trip.name);
                                            }}
                                            title={t("deleteTripTitle")}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {!trips || trips.length === 0 && (
                            <li className="col-span-full bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-white/50 shadow-lg text-center">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-700">{t("noTripsYet")}</h3>
                                        <p className="text-slate-500 mt-1">{t("createFirstTripHint")}</p>
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
