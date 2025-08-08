"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";

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
    const router = useRouter();

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/trips", { cache: "no-store" });
            const data = await res.json();
            setTrips(data);
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
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">{t("title")}</h1>

            <div className="card space-y-3">
                <h2 className="font-medium">{t("create")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input className="input" placeholder={t("name")} value={name} onChange={e => setName(e.target.value)} />
                    <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} aria-label={t("start")} />
                    <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} aria-label={t("end")} />
                </div>
                <button className="btn btn-primary disabled:opacity-50" disabled={loading} onClick={createTrip}>
                    {loading ? t("creating") : t("createBtn")}
                </button>
            </div>

            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {trips.map(trip => (
                    <li key={trip.id} className="card flex items-center justify-between">
                        <div>
                            <div className="font-medium">{trip.name}</div>
                            <div className="text-sm text-slate-600">
                                {new Date(trip.startDate).toDateString()} → {new Date(trip.endDate).toDateString()}
                            </div>
                        </div>
                        <button className="btn btn-secondary" onClick={() => router.push(`/trips/${trip.id}`)}>
                            {t("open")}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
