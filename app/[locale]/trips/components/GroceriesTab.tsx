"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import { enumerateUtcYmdInclusive, formatHumanYmd } from "@/lib/dates";
import { featureFlags } from "@/lib/feature-flags";
import GrocerySummary, { type GrocerySummaryData } from "@/app/components/GrocerySummary";
import Loader from "@/app/components/Loader";
import { ShoppingCart } from "lucide-react";

type Trip = { id: string; name: string; startDate: string; endDate: string };

interface GroceriesTabProps {
    tripId: string;
    trip: Trip | null;
}

export function GroceriesTab({ tripId, trip }: GroceriesTabProps) {
    const locale = useLocale();
    const [date, setDate] = useState("");
    const [busy, setBusy] = useState(false);
    const [items, setItems] = useState<Array<{ name: string; quantity?: string; category?: string }>>([]);
    const [summary, setSummary] = useState<GrocerySummaryData | null>(null);
    const [allDays, setAllDays] = useState<Array<{ date: string; items: Array<{ name: string; quantity?: string; category?: string }>; summary: GrocerySummaryData | null }>>([]);

    // Auto-load groceries when date changes (feature flag controlled)
    useEffect(() => {
        if (featureFlags.autoLoadGroceries && date) {
            load(date);
        }
    }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

    async function load(dateStr: string) {
        setBusy(true);
        try {
            const res = await fetch(`/api/groceries?tripId=${tripId}&date=${dateStr}`, { cache: "no-store" });
            if (!res.ok) {
                setItems([]);
                setSummary(null);
                return;
            }
            const data = await res.json();
            setItems(data.items ?? []);
            setSummary((data.summary ?? null) as GrocerySummaryData | null);
        } finally {
            setBusy(false);
        }
    }

    async function generate(autoCalc: boolean) {
        if (!date) return;
        setBusy(true);
        try {
            const res = await fetch(`/api/groceries`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ tripId, date, autoCalculateServings: autoCalc, language: locale }),
            });
            const data = await res.json();
            setItems(data.items ?? []);
            setSummary((data.summary ?? null) as GrocerySummaryData | null);
        } finally {
            setBusy(false);
        }
    }

    async function clearDay() {
        if (!date) return;
        if (!confirm("Clear all groceries and assignments for this day?")) return;
        setBusy(true);
        try {
            const encoded = encodeURIComponent(date);
            const res = await fetch(`/api/trips/${tripId}/day/${encoded}/clear`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to clear day");
            setItems([]);
            setSummary(null);
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="card space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Groceries</h2>
                </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
                <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                {!featureFlags.autoLoadGroceries && (
                    <button className="btn btn-secondary" disabled={!date || busy} onClick={() => load(date)}>
                        Load
                    </button>
                )}
                <button className="btn btn-primary" disabled={!date || busy} onClick={() => generate(true)}>
                    {busy ? (
                        <div className="flex items-center gap-2">
                            <Loader size="sm" />
                            Generating...
                        </div>
                    ) : (
                        "Generate (auto servings)"
                    )}
                </button>
                <button className="btn btn-secondary hover:bg-red-50 hover:border-red-200 hover:text-red-600" disabled={!date || busy} onClick={clearDay}>
                    Clear groceries and assignees
                </button>
            </div>
            {items.length > 0 && summary && (
                <div>
                    <div className="text-sm text-slate-600 mb-2">Selected day</div>
                    <GrocerySummary summary={summary} groceries={items} />
                </div>
            )}

            {trip && (
                <div className="space-y-3">
                    <div className="text-sm text-slate-600">All days</div>
                    <AllDaysGroceries tripId={tripId} startDate={trip.startDate} endDate={trip.endDate} />
                </div>
            )}
        </section>
    );
}

function AllDaysGroceries({ tripId, startDate, endDate }: { tripId: string; startDate: string; endDate: string }) {
    const locale = useLocale();
    const [days, setDays] = useState<Array<{ date: string; items: Array<{ name: string; quantity?: string; category?: string }>; summary: GrocerySummaryData | null }>>([]);
    const allDates = useMemo(() => enumerateUtcYmdInclusive(startDate, endDate), [startDate, endDate]);

    useEffect(() => {
        let cancelled = false;
        async function loadAll() {
            const results: Array<{ date: string; items: Array<{ name: string; quantity?: string; category?: string }>; summary: GrocerySummaryData | null }> = [];
            for (const d of allDates) {
                const res = await fetch(`/api/groceries?tripId=${tripId}&date=${d}`, { cache: "no-store" });
                if (!res.ok) {
                    results.push({ date: d, items: [], summary: null });
                    continue;
                }
                const data = await res.json();
                results.push({ date: d, items: data.items ?? [], summary: (data.summary ?? null) as GrocerySummaryData | null });
            }
            if (!cancelled) setDays(results);
        }
        if (tripId && allDates.length > 0) loadAll();
        return () => {
            cancelled = true;
        };
    }, [tripId, allDates]);

    if (days.length === 0) return null;

    return (
        <div className="space-y-6">
            {days.map(({ date, items, summary }) => (
                <div key={date} className="border border-slate-200 rounded-xl p-3 bg-white/70">
                    <div className="text-sm font-medium text-slate-700 mb-2">{formatHumanYmd(date, locale)}</div>
                    {items.length > 0 && summary ? (
                        <GrocerySummary summary={summary} groceries={items} />
                    ) : (
                        <div className="text-sm text-slate-500">No groceries generated for this day</div>
                    )}
                </div>
            ))}
        </div>
    );
}