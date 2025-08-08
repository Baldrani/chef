"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { enumerateUtcYmdInclusive } from "@/lib/dates";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

type MealSlot = {
    id: string;
    date: string;
    mealType: MealType;
    assignments?: { participant: { name: string } }[];
    recipes?: { recipe: { id: string; title: string } }[];
};

type Trip = { id: string; name: string; startDate: string; endDate: string };

type ParticipantRow = {
    id: string;
    name: string;
    cookingPreference: number;
    availabilities: { date: string }[];
};

export default function TripPage() {
    const params = useParams<{ tripId: string }>();
    const tripId = params?.tripId as string;
    const locale = useLocale();

    const [trip, setTrip] = useState<Trip | null>(null);
    const [participants, setParticipants] = useState<ParticipantRow[]>([]);

    const [days, setDays] = useState<{ date: string; mealTypes: MealType[] }[]>([]);
    const [participantsName, setParticipantsName] = useState("");
    const [preference, setPreference] = useState<number>(0);
    const [availabilityInput, setAvailabilityInput] = useState("");

    const [slots, setSlots] = useState<MealSlot[]>([]);
    const [selectedSlotId, setSelectedSlotId] = useState<string>("");
    const [recipeTitle, setRecipeTitle] = useState("");
    const [recipeServes, setRecipeServes] = useState<number | undefined>();
    const [recipeNotes, setRecipeNotes] = useState("");

    const [groceriesDate, setGroceriesDate] = useState("");
    const [groceries, setGroceries] = useState<{ name: string; quantity?: string; category?: string }[]>([]);

    const [cooksPerMeal, setCooksPerMeal] = useState<number>(2);
    const [helpersPerMeal, setHelpersPerMeal] = useState<number>(0);
    const [avoidConsecutive, setAvoidConsecutive] = useState<boolean>(true);

    const [tab, setTab] = useState<"schedule" | "meals" | "participants" | "recipes" | "groceries" | "invites">("schedule");

    const refreshTrip = useCallback(async () => {
        if (!tripId) return;
        const res = await fetch(`/api/trips/${tripId}`, { cache: "no-store" });
        if (res.ok) setTrip(await res.json());
    }, [tripId]);

    const refreshParticipants = useCallback(async () => {
        if (!tripId) return;
        const res = await fetch(`/api/participants?tripId=${tripId}`, { cache: "no-store" });
        if (res.ok) setParticipants(await res.json());
    }, [tripId]);

    const refreshSchedule = useCallback(async () => {
        if (!tripId) return;
        const res = await fetch(`/api/trips/${tripId}/schedule`, { cache: "no-store" });
        const data = await res.json();
        setSlots(data);
    }, [tripId]);

    useEffect(() => {
        refreshTrip();
        refreshParticipants();
        refreshSchedule();
    }, [refreshTrip, refreshParticipants, refreshSchedule]);

    function addDay(date: string, mealTypes: MealType[]) {
        if (!date || mealTypes.length === 0) return;
        setDays(d => [...d, { date, mealTypes }]);
    }

    async function submitMeals() {
        if (days.length === 0) return;
        await fetch(`/api/trips/${tripId}/meals`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ days }),
        });
        setDays([]);
        await refreshSchedule();
    }

    async function addParticipant() {
        const availability = availabilityInput
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
        await fetch(`/api/participants`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tripId, name: participantsName, cookingPreference: preference, availability }),
        });
        setParticipantsName("");
        setPreference(0);
        setAvailabilityInput("");
        await refreshParticipants();
    }

    async function genSchedule() {
        await fetch(`/api/schedule/generate`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tripId, maxCooksPerMeal: cooksPerMeal, maxHelpersPerMeal: helpersPerMeal, avoidConsecutive }),
        });
        await refreshSchedule();
    }

    async function addRecipe() {
        await fetch(`/api/recipes`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tripId, title: recipeTitle, notes: recipeNotes || undefined, serves: recipeServes, mealSlotId: selectedSlotId || undefined }),
        });
        setRecipeTitle("");
        setRecipeNotes("");
        setRecipeServes(undefined);
        await refreshSchedule();
    }

    async function generateGroceries() {
        const res = await fetch(`/api/groceries`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tripId, date: groceriesDate }),
        });
        const data = await res.json();
        setGroceries(data.items ?? []);
    }

    const slotsByDate = useMemo(() => {
        const map = new Map<string, MealSlot[]>();
        for (const s of slots) {
            const key = new Date(s.date).toISOString().slice(0, 10);
            const arr = map.get(key) ?? [];
            arr.push(s);
            map.set(key, arr);
        }
        return map;
    }, [slots]);

    const totalMeals = slots.length;
    const participantCount = participants.length;
    const tripDaysSet = useMemo(() => {
        if (!trip) return new Set<string>();
        return new Set(enumerateUtcYmdInclusive(trip.startDate, trip.endDate));
    }, [trip]);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-slate-600">
                        <Link href="/admin" className="underline">
                            Back
                        </Link>
                    </div>
                    <h1 className="text-2xl font-semibold">{trip?.name ?? "Trip"}</h1>
                    <div className="text-sm text-slate-600">{trip ? `${new Date(trip.startDate).toDateString()} → ${new Date(trip.endDate).toDateString()}` : ""}</div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn btn-secondary" onClick={genSchedule}>
                        Generate schedule
                    </button>
                    <a className="btn btn-secondary" href={`/api/trips/${tripId}/schedule/ics`} target="_blank" rel="noreferrer">
                        Export ICS
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat title="Participants" value={participantCount} />
                <Stat title="Meals" value={totalMeals} />
                <Stat title="Cooks/meal" value={cooksPerMeal} />
                <Stat title="Helpers/meal" value={helpersPerMeal} />
            </div>

            <nav className="border-b flex gap-4 text-sm">
                {(["schedule", "meals", "participants", "recipes", "groceries", "invites"] as const).map(t => (
                    <button
                        key={t}
                        className={`py-2 -mb-px border-b-2 ${tab === t ? "border-slate-900 text-slate-900" : "border-transparent text-slate-600 hover:text-slate-800"}`}
                        onClick={() => setTab(t)}
                    >
                        {t[0].toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </nav>

            {tab === "meals" && (
                <section className="card space-y-3">
                    <h2 className="font-medium">Define meals</h2>
                    <MealAdder onAdd={(date, meals) => addDay(date, meals)} />
                    {days.length > 0 ? (
                        <div className="text-sm text-slate-600">Pending days: {days.map(d => `${d.date} [${d.mealTypes.join(", ")}]`).join(", ")}</div>
                    ) : (
                        <div className="text-sm text-slate-500">Select a date and choose meals to add.</div>
                    )}
                    <button className="btn btn-primary" onClick={submitMeals}>
                        Save meals
                    </button>
                </section>
            )}

            {tab === "participants" && (
                <section className="card space-y-4">
                    <h2 className="font-medium">Participants</h2>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <input className="input" placeholder="Name" value={participantsName} onChange={e => setParticipantsName(e.target.value)} />
                        <select className="input" value={preference} onChange={e => setPreference(parseInt(e.target.value))}>
                            <option value={2}>Loves cooking (+2)</option>
                            <option value={1}>Enjoys cooking (+1)</option>
                            <option value={0}>Neutral (0)</option>
                            <option value={-1}>Prefers not to (-1)</option>
                            <option value={-2}>Hates cooking (-2)</option>
                        </select>
                    </div>

                    {trip && <AvailabilityPicker startDate={trip.startDate} endDate={trip.endDate} onChange={dates => setAvailabilityInput(dates.join(","))} />}

                    <button className="btn btn-primary" onClick={addParticipant}>
                        Add
                    </button>

                    <ul className="divide-y">
                        {participants.map(p => (
                            <li key={p.id} className="py-2 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-sm text-slate-600">
                                        Pref: {p.cookingPreference} • Available: {p.availabilities.map(a => new Date(a.date).toISOString().slice(0, 10)).join(", ") || "-"}
                                    </div>
                                </div>
                            </li>
                        ))}
                        {participants.length === 0 && <li className="py-2 text-sm text-slate-500">No participants yet.</li>}
                    </ul>
                </section>
            )}

            {tab === "recipes" && (
                <section className="card space-y-3">
                    <h2 className="font-medium">Recipes</h2>
                    <div className="grid gap-3 sm:grid-cols-4">
                        <input className="input" placeholder="Title" value={recipeTitle} onChange={e => setRecipeTitle(e.target.value)} />
                        <input
                            className="input"
                            placeholder="Serves (optional)"
                            type="number"
                            value={recipeServes ?? ""}
                            onChange={e => setRecipeServes(e.target.value ? Number(e.target.value) : undefined)}
                        />
                        <select className="input" value={selectedSlotId} onChange={e => setSelectedSlotId(e.target.value)}>
                            <option value="">No assignment</option>
                            {[...slotsByDate.entries()].map(([date, arr]) => (
                                <optgroup key={date} label={date}>
                                    {arr.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.mealType}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <input className="input sm:col-span-4" placeholder="Notes (optional)" value={recipeNotes} onChange={e => setRecipeNotes(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={addRecipe}>
                        Add recipe
                    </button>
                </section>
            )}

            {tab === "schedule" && (
                <section className="card space-y-3">
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Cooks</label>
                            <input
                                className="input w-16"
                                type="number"
                                min={1}
                                max={6}
                                value={cooksPerMeal}
                                onChange={e => setCooksPerMeal(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
                            />
                            <label className="text-sm text-slate-600">Helpers</label>
                            <input
                                className="input w-16"
                                type="number"
                                min={0}
                                max={6}
                                value={helpersPerMeal}
                                onChange={e => setHelpersPerMeal(Math.max(0, Math.min(6, Number(e.target.value) || 0)))}
                            />
                            <label className="text-sm text-slate-600 flex items-center gap-1">
                                <input type="checkbox" checked={avoidConsecutive} onChange={e => setAvoidConsecutive(e.target.checked)} />
                                Avoid consecutive
                            </label>
                            <button className="btn btn-secondary" onClick={genSchedule}>
                                Generate
                            </button>
                        </div>
                        <a className="underline text-sm" href={`/api/trips/${tripId}/schedule/ics`} target="_blank" rel="noreferrer">
                            Export ICS
                        </a>
                    </div>
                    <div className="space-y-4">
                        {[...slotsByDate.entries()].map(([date, arr]) => {
                            const outOfPeriod = trip && !tripDaysSet.has(date);
                            return (
                                <div key={date} className="space-y-2">
                                    <div className="text-sm text-slate-600 flex items-center gap-2">
                                        <span>{date}</span>
                                        {outOfPeriod && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Outside trip</span>}
                                    </div>
                                    <ul className="grid sm:grid-cols-3 gap-2">
                                        {arr.map(s => (
                                            <MealCard key={s.id} slot={s} outOfPeriod={!!outOfPeriod} onChanged={refreshSchedule} />
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                        {slots.length === 0 && <div className="text-sm text-slate-500">No meals yet. Add meals in the Meals tab.</div>}
                    </div>
                </section>
            )}

            {tab === "invites" && (
                <section className="card space-y-3">
                    <h2 className="font-medium">Invite</h2>
                    <InviteManager tripId={tripId} />
                </section>
            )}

            {tab === "groceries" && (
                <section className="card space-y-3">
                    <h2 className="font-medium">Groceries</h2>
                    <div className="flex gap-3">
                        <input className="input" type="date" value={groceriesDate} onChange={e => setGroceriesDate(e.target.value)} />
                        <button className="btn btn-primary" onClick={generateGroceries}>
                            Generate
                        </button>
                    </div>
                    {groceries.length > 0 && (
                        <ul className="list-disc pl-6 text-slate-700">
                            {groceries.map((i, idx) => (
                                <li key={idx}>
                                    {i.name}
                                    {i.quantity ? ` — ${i.quantity}` : ""}
                                    {i.category ? ` (${i.category})` : ""}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </div>
    );
}

function Stat({ title, value }: { title: string; value: string | number }) {
    return (
        <div className="card">
            <div className="text-sm text-slate-600">{title}</div>
            <div className="text-xl font-semibold">{value}</div>
        </div>
    );
}

function MealAdder({ onAdd }: { onAdd: (date: string, meals: MealType[]) => void }) {
    const [date, setDate] = useState("");
    const [meals, setMeals] = useState<Record<MealType, boolean>>({ BREAKFAST: false, LUNCH: false, DINNER: true });

    function toggle(meal: MealType) {
        setMeals(m => ({ ...m, [meal]: !m[meal] }));
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            {(["BREAKFAST", "LUNCH", "DINNER"] as MealType[]).map(m => (
                <label key={m} className="flex items-center gap-2">
                    <input type="checkbox" checked={meals[m]} onChange={() => toggle(m)} />
                    <span>{m}</span>
                </label>
            ))}
            <button
                className="btn btn-secondary"
                onClick={() =>
                    onAdd(
                        date,
                        (Object.keys(meals) as MealType[]).filter(k => meals[k])
                    )
                }
            >
                Add day
            </button>
        </div>
    );
}

function AvailabilityPicker({ startDate, endDate, onChange }: { startDate: string; endDate: string; onChange: (dates: string[]) => void }) {
    const [selected, setSelected] = useState<Record<string, boolean>>({});

    const allDates = useMemo(() => enumerateUtcYmdInclusive(startDate, endDate), [startDate, endDate]);

    useEffect(() => {
        onChange(
            Object.entries(selected)
                .filter(([_, v]) => v)
                .map(([k]) => k)
        );
    }, [selected, onChange]);

    function toggle(date: string) {
        setSelected(s => ({ ...s, [date]: !s[date] }));
    }

    return (
        <div className="space-y-2">
            <div className="text-sm text-slate-600">Availability</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {allDates.map(d => (
                    <label key={d} className="flex items-center gap-2 border rounded px-2 py-2 bg-white/70">
                        <input type="checkbox" checked={!!selected[d]} onChange={() => toggle(d)} />
                        <span>{d}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

function InviteManager({ tripId }: { tripId: string }) {
    const [invites, setInvites] = useState<Array<{ id: string; token: string; createdAt: string }>>([]);
    const [creating, setCreating] = useState(false);

    const refresh = useCallback(async () => {
        const res = await fetch(`/api/trips/${tripId}/invites`, { cache: "no-store" });
        const data = await res.json();
        setInvites(data);
    }, [tripId]);

    useEffect(() => {
        if (tripId) refresh();
    }, [tripId, refresh]);

    async function createInvite() {
        setCreating(true);
        try {
            await fetch(`/api/trips/${tripId}/invites`, { method: "POST" });
            await refresh();
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="space-y-2">
            <button className="btn btn-secondary" disabled={creating} onClick={createInvite}>
                {creating ? "Creating..." : "Create invite link"}
            </button>
            {invites.length > 0 && (
                <ul className="text-sm space-y-1 text-slate-700">
                    {invites.map(i => (
                        <li key={i.id} className="break-all">
                            {typeof window !== "undefined" ? `${window.location.origin}/join/${i.token}` : `/join/${i.token}`}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function MealCard({ slot, outOfPeriod, onChanged }: { slot: MealSlot; outOfPeriod: boolean; onChanged: () => Promise<void> }) {
    const [editing, setEditing] = useState(false);
    const [dateYmd, setDateYmd] = useState<string>(new Date(slot.date).toISOString().slice(0, 10));
    const [mealType, setMealType] = useState<MealType>(slot.mealType);
    const [busy, setBusy] = useState(false);

    async function save() {
        setBusy(true);
        try {
            await fetch(`/api/meals/${slot.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ date: dateYmd, mealType }),
            });
            setEditing(false);
            await onChanged();
        } finally {
            setBusy(false);
        }
    }

    async function del() {
        if (!confirm("Delete this meal?")) return;
        setBusy(true);
        try {
            await fetch(`/api/meals/${slot.id}`, { method: "DELETE" });
            await onChanged();
        } finally {
            setBusy(false);
        }
    }

    if (!editing) {
        return (
            <li className={`card ${outOfPeriod ? "border-red-300 bg-red-50" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="font-medium">{slot.mealType}</div>
                        <div className="text-xs text-slate-600">{new Date(slot.date).toISOString().slice(0, 10)}</div>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                            Edit
                        </button>
                        <button className="btn btn-secondary" onClick={del} disabled={busy}>
                            Delete
                        </button>
                    </div>
                </div>
                <div className="text-sm text-slate-600 mt-2">Cooks: {(slot.assignments ?? []).map(a => a.participant.name).join(", ") || "-"}</div>
                <div className="text-sm text-slate-600">Recipes: {(slot.recipes ?? []).map(r => r.recipe.title).join(", ") || "-"}</div>
            </li>
        );
    }

    return (
        <li className={`card ${outOfPeriod ? "border-red-300 bg-red-50" : ""}`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <input className="input" type="date" value={dateYmd} onChange={e => setDateYmd(e.target.value)} />
                <select className="input" value={mealType} onChange={e => setMealType(e.target.value as MealType)}>
                    {(["BREAKFAST", "LUNCH", "DINNER"] as MealType[]).map(m => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                </select>
                <div className="flex gap-2 justify-end">
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setEditing(false);
                            setDateYmd(new Date(slot.date).toISOString().slice(0, 10));
                            setMealType(slot.mealType);
                        }}
                    >
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={save} disabled={busy}>
                        Save
                    </button>
                </div>
            </div>
        </li>
    );
}
