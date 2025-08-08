"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { enumerateUtcYmdInclusive } from "@/lib/dates";

export default function JoinPage() {
    const params = useParams<{ token: string }>();
    const router = useRouter();
    const locale = useLocale();
    const token = (params?.token as string) || "";

    const [name, setName] = useState("");
    const [pref, setPref] = useState(0);
    const [selectedDates, setSelectedDates] = useState<Record<string, boolean>>({});
    const [trip, setTrip] = useState<{ name: string; startDate: string; endDate: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            if (!token) return;
            const res = await fetch(`/api/invites/${token}`, { cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            setTrip(data.trip);
        })();
    }, [token]);

    const allDates: string[] = useMemo(() => {
        if (!trip) return [];
        return enumerateUtcYmdInclusive(trip.startDate, trip.endDate);
    }, [trip]);

    function toggle(date: string) {
        setSelectedDates(s => ({ ...s, [date]: !s[date] }));
    }

    async function accept() {
        setBusy(true);
        setError(null);
        try {
            const availability = Object.entries(selectedDates)
                .filter(([, v]) => v)
                .map(([k]) => k);
            const res = await fetch(`/api/invites/${token}/accept`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name, cookingPreference: pref, availability }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                setError(j.error || "Failed to join");
                return;
            }
            const participant = await res.json();
            router.push(`/${locale}/trips/${participant.tripId}`);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="max-w-md mx-auto p-6 space-y-4">
            <h1 className="text-xl font-semibold">Join {trip?.name ?? "trip"}</h1>
            <input className="border rounded px-3 py-2 w-full" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            <label className="block text-sm">Cooking preference</label>
            <select className="border rounded px-3 py-2 w-full" value={pref} onChange={e => setPref(parseInt(e.target.value))}>
                <option value={2}>Loves cooking (+2)</option>
                <option value={1}>Enjoys cooking (+1)</option>
                <option value={0}>Neutral (0)</option>
                <option value={-1}>Prefers not to (-1)</option>
                <option value={-2}>Hates cooking (-2)</option>
            </select>

            {allDates.length > 0 && (
                <div className="space-y-2">
                    <div className="text-sm text-slate-600">Select your available days</div>
                    <div className="grid grid-cols-2 gap-2">
                        {allDates.map(d => (
                            <label key={d} className="flex items-center gap-2 border rounded px-2 py-2">
                                <input type="checkbox" checked={!!selectedDates[d]} onChange={() => toggle(d)} />
                                <span>{d}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button className="bg-black text-white rounded px-4 py-2 w-full disabled:opacity-50" onClick={accept} disabled={busy || !name}>
                {busy ? "Joining..." : "Join"}
            </button>
        </div>
    );
}
