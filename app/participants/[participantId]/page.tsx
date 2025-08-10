"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { formatHumanDate } from "@/lib/dates";
import Loader from "@/app/components/Loader";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

type MealSlot = { id: string; date: string; mealType: MealType; assignments?: { participant: { id: string } }[] };

type Participant = {
    id: string;
    tripId: string;
    name: string;
    cookingPreference: number;
    availabilities: { date: string }[];
};

export default function ParticipantSchedulePage() {
    const params = useParams<{ participantId: string }>();
    const participantId = params?.participantId as string;
    const locale = useLocale();

    const [participant, setParticipant] = useState<Participant | null>(null);
    const [slots, setSlots] = useState<MealSlot[]>([]);
    const [busy, setBusy] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    async function refresh() {
        if (!participantId) return;
        setIsLoading(true);
        try {
            const p = await fetch(`/api/participants/${participantId}`, { cache: "no-store" }).then(r => r.json());
            setParticipant(p);
            if (p?.tripId) {
                const s = await fetch(`/api/trips/${p.tripId}/schedule`, { cache: "no-store" }).then(r => r.json());
                setSlots(s);
            }
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [participantId]);

    const slotByDate = useMemo(() => {
        const map = new Map<string, MealSlot[]>();
        for (const s of slots) {
            const key = new Date(s.date).toISOString().slice(0, 10);
            const arr = map.get(key) ?? [];
            arr.push(s);
            map.set(key, arr);
        }
        return map;
    }, [slots]);

    if (isLoading) {
        return (
            <div className="p-4">
                <Loader size="lg" text="Loading participant data..." className="py-20" />
            </div>
        );
    }

    if (!participant) {
        return <div className="p-4 text-center text-slate-500">Participant not found</div>;
    }

    async function setAssignment(mealSlotId: string, role: "COOK" | "HELPER" | null) {
        setBusy(true);
        try {
            if (role === null) {
                await fetch(`/api/meals/${mealSlotId}/participants/${encodeURIComponent(participantId)}`, { method: "DELETE" });
            } else {
                await fetch(`/api/meals/${mealSlotId}/participants/${encodeURIComponent(participantId)}`, {
                    method: "PUT",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ role }),
                });
            }
            await refresh();
        } finally {
            setBusy(false);
        }
    }

    function roleInSlot(s: MealSlot): "COOK" | "HELPER" | null {
        return s.assignments?.some(a => a.participant.id === participantId) ? "COOK" : null; // only shows presence; page doesn’t include role detail in schedule list
    }

    return (
        <div className="p-4 space-y-4">
            <div>
                <Link href={`/trips/${participant.tripId}`} className="underline">
                    Back to trip
                </Link>
            </div>
            <div className="card space-y-2">
                <div className="font-medium">{participant.name}</div>
                <div className="text-sm text-slate-600">
                    Pref: {participant.cookingPreference} • Available: {participant.availabilities.map(a => formatHumanDate(a.date, locale)).join(", ") || "-"}
                </div>
            </div>
            <div className="card space-y-3">
                <h2 className="font-medium">Schedule</h2>
                {[...slotByDate.entries()].map(([date, list]) => (
                    <div key={date} className="space-y-2">
                        <div className="text-sm text-slate-600">{formatHumanDate(date, locale)}</div>
                        <ul className="grid gap-2 sm:grid-cols-3">
                            {list.map(s => {
                                const current = roleInSlot(s);
                                return (
                                    <li key={s.id} className="card">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-medium">{s.mealType}</div>
                                            <div className="flex gap-2">
                                                <button className="btn btn-secondary" disabled={busy || current === "COOK"} onClick={() => setAssignment(s.id, "COOK")}>
                                                    Cook
                                                </button>
                                                <button className="btn btn-secondary" disabled={busy || current === "HELPER"} onClick={() => setAssignment(s.id, "HELPER")}>
                                                    Helper
                                                </button>
                                                <button className="btn btn-secondary" disabled={busy || current === null} onClick={() => setAssignment(s.id, null)}>
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
                {slots.length === 0 && <div className="text-sm text-slate-500">No meals yet.</div>}
            </div>
        </div>
    );
}
