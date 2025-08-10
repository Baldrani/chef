"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { enumerateUtcYmdInclusive, formatHumanDate, formatHumanYmd } from "@/lib/dates";
import FancyCheckbox from "@/app/components/FancyCheckbox";
import Loader from "@/app/components/Loader";
import { LinkIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

type MealSlot = {
    id: string;
    date: string;
    mealType: MealType;
    assignments?: { participant: { id: string; name: string }; role: "COOK" | "HELPER" }[];
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
    const [recipes, setRecipes] = useState<Array<{ id: string; title: string; notes?: string | null; serves?: number | null }>>([]);

    const [groceriesDate, setGroceriesDate] = useState("");
    const [groceries, setGroceries] = useState<{ name: string; quantity?: string; category?: string }[]>([]);

    const [cooksPerMeal, setCooksPerMeal] = useState<number>(2);
    const [helpersPerMeal, setHelpersPerMeal] = useState<number>(0);
    const [avoidConsecutive, setAvoidConsecutive] = useState<boolean>(true);

    const [tab, setTab] = useState<"summary" | "schedule" | "meals" | "participants" | "recipes" | "groceries">("summary");
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
    const [isGeneratingGroceries, setIsGeneratingGroceries] = useState(false);
    const [isSubmittingMeals, setIsSubmittingMeals] = useState(false);
    const [isAddingParticipant, setIsAddingParticipant] = useState(false);
    const [isAddingRecipe, setIsAddingRecipe] = useState(false);

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

    const refreshRecipes = useCallback(async () => {
        if (!tripId) return;
        const res = await fetch(`/api/recipes?tripId=${tripId}`, { cache: "no-store" });
        if (res.ok) setRecipes(await res.json());
    }, [tripId]);

    const [invite, setInvite] = useState<{ id: string; token: string } | null>(null);

    const refreshInvite = useCallback(async () => {
        if (!tripId) return;
        const res = await fetch(`/api/trips/${tripId}/invites`, { cache: "no-store" });
        if (res.ok) setInvite(await res.json());
    }, [tripId]);

    useEffect(() => {
        async function loadInitialData() {
            setIsLoading(true);
            await Promise.all([
                refreshTrip(),
                refreshParticipants(),
                refreshSchedule(),
                refreshRecipes(),
                refreshInvite()
            ]);
            setIsLoading(false);
        }
        loadInitialData();
    }, [refreshTrip, refreshParticipants, refreshSchedule, refreshRecipes, refreshInvite]);

    function addDay(date: string, mealTypes: MealType[]) {
        if (!date || mealTypes.length === 0) return;
        setDays(d => [...d, { date, mealTypes }]);
    }

    async function submitMeals() {
        if (days.length === 0) return;
        setIsSubmittingMeals(true);
        try {
            await fetch(`/api/trips/${tripId}/meals`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ days }),
            });
            setDays([]);
            await refreshSchedule();
        } finally {
            setIsSubmittingMeals(false);
        }
    }

    async function addParticipant() {
        const availability = availabilityInput
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
        setIsAddingParticipant(true);
        try {
            await fetch(`/api/participants`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ tripId, name: participantsName, cookingPreference: preference, availability }),
            });
            setParticipantsName("");
            setPreference(0);
            setAvailabilityInput("");
            await refreshParticipants();
        } finally {
            setIsAddingParticipant(false);
        }
    }

    const [autoAssignRecipes, setAutoAssignRecipes] = useState<boolean>(false);
    const [recipesPerMeal, setRecipesPerMeal] = useState<number>(1);

    async function genSchedule() {
        setIsGeneratingSchedule(true);
        try {
            await fetch(`/api/schedule/generate`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    tripId,
                    maxCooksPerMeal: cooksPerMeal,
                    maxHelpersPerMeal: helpersPerMeal,
                    avoidConsecutive,
                    autoAssignRecipes,
                    recipesPerMeal,
                }),
            });
            await refreshSchedule();
            await refreshRecipes();
        } finally {
            setIsGeneratingSchedule(false);
        }
    }

    async function addRecipe() {
        setIsAddingRecipe(true);
        try {
            await fetch(`/api/recipes`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ tripId, title: recipeTitle, notes: recipeNotes || undefined, serves: recipeServes, mealSlotId: selectedSlotId || undefined }),
            });
            setRecipeTitle("");
            setRecipeNotes("");
            setRecipeServes(undefined);
            await refreshSchedule();
            await refreshRecipes();
        } finally {
            setIsAddingRecipe(false);
        }
    }

    async function generateGroceries() {
        setIsGeneratingGroceries(true);
        try {
            const res = await fetch(`/api/groceries`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ tripId, date: groceriesDate }),
            });
            const data = await res.json();
            setGroceries(data.items ?? []);
        } finally {
            setIsGeneratingGroceries(false);
        }
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

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <Loader size="lg" text="Loading trip data..." className="py-20" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Link 
                                href="/admin" 
                                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 transition-colors font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Admin
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {trip?.name ?? "Trip"}
                            </h1>
                            {invite && <CopyInviteButton token={invite.token} />}
                        </div>
                        <div className="text-lg text-slate-600 font-medium">
                            {trip ? `${formatHumanDate(trip.startDate, locale)} → ${formatHumanDate(trip.endDate, locale)}` : ""}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button className="btn btn-primary" onClick={genSchedule} disabled={isGeneratingSchedule}>
                            {isGeneratingSchedule ? (
                                <div className="flex items-center gap-2">
                                    <Loader size="sm" />
                                    Generating...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Generate Schedule
                                </div>
                            )}
                        </button>
                        <a 
                            className="btn btn-secondary" 
                            href={`/api/trips/${tripId}/schedule/ics`} 
                            target="_blank" 
                            rel="noreferrer"
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export ICS
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat title="Participants" value={participantCount} />
                <Stat title="Meals" value={totalMeals} />
                <Stat title="Cooks/meal" value={cooksPerMeal} />
                <Stat title="Helpers/meal" value={helpersPerMeal} />
            </div>

            <nav className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 border border-white/50 shadow-lg">
                <div className="flex flex-wrap gap-2">
                    {(["summary", "schedule", "meals", "participants", "recipes", "groceries"] as const).map(t => (
                        <button
                            key={t}
                            className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                                tab === t 
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 transform scale-105" 
                                    : "text-slate-600 hover:text-purple-600 hover:bg-white/70 hover:shadow-md hover:scale-105"
                            }`}
                            onClick={() => setTab(t)}
                        >
                            {t[0].toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
            </nav>

            {tab === "summary" && (
                <section className="card space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="font-medium">Summary</h2>
                        <button className="btn btn-secondary" onClick={() => typeof window !== "undefined" && window.print()}>
                            Print
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Stat title="Participants" value={participantCount} />
                        <Stat title="Meals" value={totalMeals} />
                        <Stat title="Recipes" value={recipes.length} />
                        {trip && <Stat title="Days" value={tripDaysSet.size} />}
                    </div>

                    <div className="space-y-4">
                        {[...slotsByDate.entries()].map(([date, arr]) => {
                            const cooksFor = (s: MealSlot) =>
                                (s.assignments ?? [])
                                    .filter(a => a.role === "COOK")
                                    .map(a => a.participant.name)
                                    .join(", ") || "-";
                            const helpersFor = (s: MealSlot) =>
                                (s.assignments ?? [])
                                    .filter(a => a.role === "HELPER")
                                    .map(a => a.participant.name)
                                    .join(", ") || "-";
                            const recipeTitles = (s: MealSlot) => (s.recipes ?? []).map(r => r.recipe.title).join(", ") || "-";
                            return (
                                <div key={date} className="space-y-2">
                                    <div className="text-sm text-slate-700">{formatHumanYmd(date, locale)}</div>
                                    <ul className="grid sm:grid-cols-3 gap-2">
                                        {arr.map(s => (
                                            <li key={s.id} className="border rounded p-2 bg-white/70">
                                                <div className="text-sm font-medium">{s.mealType}</div>
                                                <div className="text-xs text-slate-600">Recipes: {recipeTitles(s)}</div>
                                                <div className="text-xs text-slate-600">Cooks: {cooksFor(s)}</div>
                                                <div className="text-xs text-slate-600">Helpers: {helpersFor(s)}</div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                        {slots.length === 0 && <div className="text-sm text-slate-500">No meals yet.</div>}
                    </div>

                    {recipes.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-medium">All recipes</h3>
                            <ul className="text-sm list-disc pl-6 text-slate-700">
                                {recipes.map(r => (
                                    <li key={r.id}>
                                        {r.title}
                                        {r.serves ? ` (serves ${r.serves})` : ""}
                                        {r.notes ? ` — ${r.notes}` : ""}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            )}

            {tab === "meals" && (
                <section className="card space-y-3">
                    <h2 className="font-medium">Define meals</h2>
                    <MealAdder onAdd={(date, meals) => addDay(date, meals)} />
                    {days.length > 0 ? (
                        <div className="text-sm text-slate-600">Pending days: {days.map(d => `${d.date} [${d.mealTypes.join(", ")}]`).join(", ")}</div>
                    ) : (
                        <div className="text-sm text-slate-500">Select a date and choose meals to add.</div>
                    )}
                    <button className="btn btn-primary" onClick={submitMeals} disabled={isSubmittingMeals}>
                        {isSubmittingMeals ? (
                            <div className="flex items-center gap-2">
                                <Loader size="sm" />
                                Saving...
                            </div>
                        ) : (
                            "Save meals"
                        )}
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

                    <button className="btn btn-primary" onClick={addParticipant} disabled={isAddingParticipant || !participantsName}>
                        {isAddingParticipant ? (
                            <div className="flex items-center gap-2">
                                <Loader size="sm" />
                                Adding...
                            </div>
                        ) : (
                            "Add"
                        )}
                    </button>

                    <ul className="divide-y">
                        {participants.map(p => (
                            <li key={p.id} className="py-2 flex items-center justify-between">
                                <div className="min-w-0">
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-sm text-slate-600">
                                        Pref: {p.cookingPreference} • Available: {p.availabilities.map(a => formatHumanDate(a.date, locale)).join(", ") || "-"}
                                    </div>
                                </div>
                                <div className="shrink-0 flex gap-2">
                                    <Link href={`/participants/${p.id}`} className="btn btn-secondary">
                                        Edit schedule
                                    </Link>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={async () => {
                                            if (!confirm(`Remove ${p.name} from trip?`)) return;
                                            await fetch(`/api/participants/${p.id}`, { method: "DELETE" });
                                            await refreshParticipants();
                                            await refreshSchedule();
                                        }}
                                    >
                                        Remove
                                    </button>
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
                    <button className="btn btn-primary" onClick={addRecipe} disabled={isAddingRecipe || !recipeTitle}>
                        {isAddingRecipe ? (
                            <div className="flex items-center gap-2">
                                <Loader size="sm" />
                                Adding...
                            </div>
                        ) : (
                            "Add recipe"
                        )}
                    </button>
                    <RecipeList
                        recipes={recipes}
                        slots={slots}
                        onChanged={async () => {
                            await refreshRecipes();
                            await refreshSchedule();
                        }}
                    />
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
                            <FancyCheckbox label="Avoid consecutive" checked={avoidConsecutive} onChange={setAvoidConsecutive} />
                            <FancyCheckbox label="Auto-assign recipes" checked={autoAssignRecipes} onChange={setAutoAssignRecipes} />
                            <label className="text-sm text-slate-600">Recipes/meal</label>
                            <input
                                className="input w-16"
                                type="number"
                                min={1}
                                max={5}
                                value={recipesPerMeal}
                                onChange={e => setRecipesPerMeal(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
                            />
                            <button className="btn btn-secondary" onClick={genSchedule} disabled={isGeneratingSchedule}>
                                {isGeneratingSchedule ? (
                                    <div className="flex items-center gap-2">
                                        <Loader size="sm" />
                                        Generating...
                                    </div>
                                ) : (
                                    "Generate"
                                )}
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

            {/* invites tab removed; invite link moved next to title */}

            {tab === "groceries" && (
                <section className="card space-y-3">
                    <h2 className="font-medium">Groceries</h2>
                    <div className="flex gap-3">
                        <input className="input" type="date" value={groceriesDate} onChange={e => setGroceriesDate(e.target.value)} />
                        <button className="btn btn-primary" onClick={generateGroceries} disabled={isGeneratingGroceries || !groceriesDate}>
                            {isGeneratingGroceries ? (
                                <div className="flex items-center gap-2">
                                    <Loader size="sm" />
                                    Generating...
                                </div>
                            ) : (
                                "Generate"
                            )}
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

function CopyInviteButton({ token }: { token: string }) {
    const [copied, setCopied] = useState(false);
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${token}`;

    async function onCopy() {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Invite link copied");
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error("Failed to copy link");
        }
    }

    return (
        <button
            type="button"
            onClick={onCopy}
            className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-110 ${
                copied 
                    ? "bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg shadow-green-500/25" 
                    : "bg-white/60 backdrop-blur-sm border border-white/50 text-slate-600 hover:text-purple-600 hover:bg-white/80 shadow-md hover:shadow-lg"
            }`}
            title={copied ? "Copied" : "Copy invite link"}
            aria-label="Copy invite link"
        >
            {copied ? <CheckIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
        </button>
    );
}

function Stat({ title, value }: { title: string; value: string | number }) {
    return (
        <div className="stat-card">
            <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">{title}</div>
            <div className="text-2xl font-bold text-slate-700 mt-1">{value}</div>
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
                <FancyCheckbox key={m} label={m} checked={meals[m]} onChange={() => toggle(m)} />
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
                .filter(([, v]) => v)
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
                    <div key={d} className="flex items-center gap-2 border rounded px-2 py-2 bg-white/70">
                        <FancyCheckbox label={d} checked={!!selected[d]} onChange={() => toggle(d)} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// InviteManager removed

function MealCard({ slot, outOfPeriod, onChanged }: { slot: MealSlot; outOfPeriod: boolean; onChanged: () => Promise<void> }) {
    const locale = useLocale();
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
                        <div className="text-xs text-slate-600">{formatHumanDate(slot.date, locale)}</div>
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
                <div className="text-sm text-slate-600 mt-2">
                    <div className="mb-1">
                        <Link href={`/meals/${slot.id}`} className="underline">
                            View meal
                        </Link>
                    </div>
                    Cooks:{" "}
                    {(slot.assignments ?? [])
                        .filter(a => a.role === "COOK")
                        .map(a => (
                            <span key={a.participant.id} className="inline-flex items-center gap-1 mr-2">
                                <span>{a.participant.name}</span>
                                <button
                                    className="text-xs underline"
                                    onClick={async () => {
                                        await fetch(`/api/meals/${slot.id}/participants/${encodeURIComponent(a.participant.id)}`, { method: "DELETE" });
                                        await onChanged();
                                    }}
                                >
                                    remove
                                </button>
                            </span>
                        ))}
                    {(slot.assignments ?? []).filter(a => a.role === "COOK").length === 0 && "-"}
                </div>
                <div className="text-sm text-slate-600">
                    Helpers:{" "}
                    {(slot.assignments ?? [])
                        .filter(a => a.role === "HELPER")
                        .map(a => (
                            <span key={a.participant.id} className="inline-flex items-center gap-1 mr-2">
                                <span>{a.participant.name}</span>
                                <button
                                    className="text-xs underline"
                                    onClick={async () => {
                                        await fetch(`/api/meals/${slot.id}/participants/${encodeURIComponent(a.participant.id)}`, { method: "DELETE" });
                                        await onChanged();
                                    }}
                                >
                                    remove
                                </button>
                            </span>
                        ))}
                    {(slot.assignments ?? []).filter(a => a.role === "HELPER").length === 0 && "-"}
                </div>
                <div className="text-sm text-slate-600">
                    Recipes:{" "}
                    {(slot.recipes ?? []).map(r => (
                        <span key={r.recipe.id} className="inline-flex items-center gap-1 mr-2">
                            <span>{r.recipe.title}</span>
                            <button
                                className="text-xs underline"
                                onClick={async () => {
                                    await fetch(`/api/meals/${slot.id}/recipes/${encodeURIComponent(r.recipe.id)}`, { method: "DELETE" });
                                    await onChanged();
                                }}
                            >
                                remove
                            </button>
                        </span>
                    ))}
                    {(slot.recipes ?? []).length === 0 && "-"}
                </div>
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
                <div className="sm:col-span-3">
                    <RecipeAssigner mealSlotId={slot.id} onChanged={onChanged} />
                </div>
            </div>
        </li>
    );
}

function RecipeList({
    recipes,
    slots,
    onChanged,
}: {
    recipes: Array<{ id: string; title: string; notes?: string | null; serves?: number | null }>;
    slots: MealSlot[];
    onChanged: () => Promise<void>;
}) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState<string>("");
    const [serves, setServes] = useState<number | undefined>(undefined);
    const [notes, setNotes] = useState<string>("");
    const [busy, setBusy] = useState(false);
    const [assignSelections, setAssignSelections] = useState<Record<string, string>>({});

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

    function startEdit(r: { id: string; title: string; notes?: string | null; serves?: number | null }) {
        setEditingId(r.id);
        setTitle(r.title);
        setServes(r.serves ?? undefined);
        setNotes(r.notes ?? "");
    }

    async function save() {
        if (!editingId) return;
        setBusy(true);
        try {
            await fetch(`/api/recipes/${editingId}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ title, notes: notes || null, serves: serves ?? null }),
            });
            setEditingId(null);
            await onChanged();
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="divide-y">
            {recipes.map(r => (
                <div key={r.id} className="py-2 flex flex-col gap-2">
                    {editingId === r.id ? (
                        <div className="grid gap-2 sm:grid-cols-4 items-center">
                            <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
                            <input
                                className="input"
                                type="number"
                                placeholder="Serves"
                                value={serves ?? ""}
                                onChange={e => setServes(e.target.value ? Number(e.target.value) : undefined)}
                            />
                            <input className="input sm:col-span-2" value={notes} onChange={e => setNotes(e.target.value)} />
                            <div className="sm:col-span-4 flex justify-end gap-2">
                                <button className="btn btn-secondary" onClick={() => setEditingId(null)}>
                                    Cancel
                                </button>
                                <button className="btn btn-primary" onClick={save} disabled={busy}>
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="font-medium truncate">{r.title}</div>
                                <div className="text-sm text-slate-600 truncate">{(r.serves ? `Serves ${r.serves}` : "") + (r.notes ? (r.serves ? " — " : "") + r.notes : "")}</div>
                            </div>
                            <button className="btn btn-secondary shrink-0" onClick={() => startEdit(r)}>
                                Edit
                            </button>
                        </div>
                    )}

                    {/* Assignments editor */}
                    <div className="text-sm text-slate-700">
                        <div className="mb-1">Assigned to:</div>
                        <div className="flex flex-wrap items-center gap-2">
                            {slots
                                .filter(s => (s.recipes ?? []).some(rr => rr.recipe.id === r.id))
                                .map(s => (
                                    <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100">
                                        <span>{s.mealType}</span>
                                        <button
                                            className="text-xs underline"
                                            onClick={async () => {
                                                await fetch(`/api/meals/${s.id}/recipes/${encodeURIComponent(r.id)}`, { method: "DELETE" });
                                                await onChanged();
                                            }}
                                        >
                                            remove
                                        </button>
                                    </span>
                                ))}
                            {slots.filter(s => (s.recipes ?? []).some(rr => rr.recipe.id === r.id)).length === 0 && <span className="text-slate-500">-</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select className="input" value={assignSelections[r.id] ?? ""} onChange={e => setAssignSelections(prev => ({ ...prev, [r.id]: e.target.value }))}>
                            <option value="">Assign to…</option>
                            {[...slotsByDate.entries()].map(([date, arr]) => (
                                <optgroup key={date} label={date}>
                                    {arr
                                        .filter(s => !(s.recipes ?? []).some(rr => rr.recipe.id === r.id))
                                        .map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.mealType}
                                            </option>
                                        ))}
                                </optgroup>
                            ))}
                        </select>
                        <button
                            className="btn btn-secondary"
                            disabled={!assignSelections[r.id] || busy}
                            onClick={async () => {
                                const slotId = assignSelections[r.id];
                                if (!slotId) return;
                                setBusy(true);
                                try {
                                    await fetch(`/api/meals/${slotId}/recipes/${encodeURIComponent(r.id)}`, { method: "PUT" });
                                    setAssignSelections(prev => ({ ...prev, [r.id]: "" }));
                                    await onChanged();
                                } finally {
                                    setBusy(false);
                                }
                            }}
                        >
                            Add
                        </button>
                    </div>
                </div>
            ))}
            {recipes.length === 0 && <div className="py-2 text-sm text-slate-500">No recipes yet.</div>}
        </div>
    );
}

function RecipeAssigner({ mealSlotId, onChanged }: { mealSlotId: string; onChanged: () => Promise<void> }) {
    const params = useParams<{ tripId: string }>();
    const tripId = params?.tripId as string;
    const [allRecipes, setAllRecipes] = useState<Array<{ id: string; title: string }>>([]);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            const res = await fetch(`/api/recipes?tripId=${encodeURIComponent(tripId)}`, { cache: "no-store" });
            if (!res.ok) return;
            const data = (await res.json()) as Array<{ id: string; title: string }>;
            if (!cancelled) setAllRecipes(data);
        }
        if (tripId) load();
        return () => {
            cancelled = true;
        };
    }, [tripId]);

    async function assign() {
        if (!selectedRecipeId) return;
        setBusy(true);
        try {
            await fetch(`/api/meals/${mealSlotId}/recipes/${encodeURIComponent(selectedRecipeId)}`, { method: "PUT" });
            setSelectedRecipeId("");
            await onChanged();
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex items-center gap-2 mt-2">
            <select className="input" value={selectedRecipeId} onChange={e => setSelectedRecipeId(e.target.value)}>
                <option value="">Assign recipe…</option>
                {allRecipes.map(r => (
                    <option key={r.id} value={r.id}>
                        {r.title}
                    </option>
                ))}
            </select>
            <button className="btn btn-secondary" disabled={!selectedRecipeId || busy} onClick={assign}>
                Add
            </button>
        </div>
    );
}
