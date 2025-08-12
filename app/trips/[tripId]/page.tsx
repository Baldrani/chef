"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { enumerateUtcYmdInclusive, formatHumanDate, formatHumanYmd, formatISODate } from "@/lib/dates";
import FancyCheckbox from "@/app/components/FancyCheckbox";
import Loader from "@/app/components/Loader";
import GrocerySummary, { type GrocerySummaryData } from "@/app/components/GrocerySummary";
import { LinkIcon, CheckIcon, UsersIcon, UtensilsIcon, BookOpenIcon, BarChart3Icon } from "lucide-react";
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
    const router = useRouter();

    const [trip, setTrip] = useState<Trip | null>(null);
    const [participants, setParticipants] = useState<ParticipantRow[]>([]);

    const [days, setDays] = useState<{ date: string; mealTypes: MealType[] }[]>([]);
    const [participantsName, setParticipantsName] = useState("");
    const [preference, setPreference] = useState<number>(0);
    const [availabilityInput, setAvailabilityInput] = useState("");

    const [slots, setSlots] = useState<MealSlot[]>([]);
    const [recipes, setRecipes] = useState<Array<{ id: string; title: string; notes?: string | null; serves?: number | null }>>([]);

    const [groceriesDate, setGroceriesDate] = useState("");
    const [groceries, setGroceries] = useState<{ name: string; quantity?: string; category?: string }[]>([]);
    const [grocerySummary, setGrocerySummary] = useState<GrocerySummaryData | null>(null);

    const [cooksPerMeal, setCooksPerMeal] = useState<number>(2);
    const [helpersPerMeal, setHelpersPerMeal] = useState<number>(0);
    const [avoidConsecutive, setAvoidConsecutive] = useState<boolean>(true);

    const [tab, setTab] = useState<"plan" | "recipes" | "team">("plan");
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
    const [isGeneratingGroceries, setIsGeneratingGroceries] = useState(false);
    const [isSubmittingMeals, setIsSubmittingMeals] = useState(false);
    const [isAddingParticipant, setIsAddingParticipant] = useState(false);
    
    // Recipe creation modal state
    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [newRecipeTitle, setNewRecipeTitle] = useState("");
    const [newRecipeNotes, setNewRecipeNotes] = useState("");
    const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);

    // Recipe editing modal state
    const [showEditRecipeModal, setShowEditRecipeModal] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<{id: string; title: string; notes?: string | null} | null>(null);
    const [editRecipeTitle, setEditRecipeTitle] = useState("");
    const [editRecipeNotes, setEditRecipeNotes] = useState("");
    const [isEditingRecipe, setIsEditingRecipe] = useState(false);
    const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);

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
            await Promise.all([refreshTrip(), refreshParticipants(), refreshSchedule(), refreshRecipes(), refreshInvite()]);
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

    async function createRecipe() {
        if (!newRecipeTitle.trim()) return;
        setIsCreatingRecipe(true);
        try {
            await fetch(`/api/recipes`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ 
                    tripId, 
                    title: newRecipeTitle.trim(), 
                    notes: newRecipeNotes.trim() || undefined
                }),
            });
            // Reset form
            setNewRecipeTitle("");
            setNewRecipeNotes("");
            setShowRecipeModal(false);
            // Refresh data
            await refreshRecipes();
            await refreshSchedule();
        } finally {
            setIsCreatingRecipe(false);
        }
    }

    function openEditRecipe(recipe: {id: string; title: string; notes?: string | null}) {
        setEditingRecipe(recipe);
        setEditRecipeTitle(recipe.title);
        setEditRecipeNotes(recipe.notes || "");
        setShowEditRecipeModal(true);
    }

    async function saveRecipeEdit() {
        if (!editingRecipe || !editRecipeTitle.trim()) return;
        setIsEditingRecipe(true);
        try {
            await fetch(`/api/recipes/${editingRecipe.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ 
                    title: editRecipeTitle.trim(), 
                    notes: editRecipeNotes.trim() || null
                }),
            });
            // Reset form
            setEditingRecipe(null);
            setEditRecipeTitle("");
            setEditRecipeNotes("");
            setShowEditRecipeModal(false);
            // Refresh data
            await refreshRecipes();
            await refreshSchedule();
        } finally {
            setIsEditingRecipe(false);
        }
    }

    async function deleteRecipe() {
        if (!editingRecipe) return;
        if (!confirm(`Are you sure you want to delete "${editingRecipe.title}"? This will remove it from all meals and cannot be undone.`)) return;
        
        setIsDeletingRecipe(true);
        try {
            await fetch(`/api/recipes/${editingRecipe.id}`, {
                method: "DELETE",
            });
            // Reset form
            setEditingRecipe(null);
            setEditRecipeTitle("");
            setEditRecipeNotes("");
            setShowEditRecipeModal(false);
            // Refresh data
            await refreshRecipes();
            await refreshSchedule();
        } finally {
            setIsDeletingRecipe(false);
        }
    }

    async function generateGroceries(autoCalculate = false) {
        setIsGeneratingGroceries(true);
        try {
            const res = await fetch(`/api/groceries`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ 
                    tripId, 
                    date: groceriesDate, 
                    autoCalculateServings: autoCalculate,
                    language: locale 
                }),
            });
            const data = await res.json();
            console.log(data);
            setGroceries(data.items ?? []);
            setGrocerySummary(data.summary ?? null);
        } finally {
            setIsGeneratingGroceries(false);
        }
    }

    const slotsByDate = useMemo(() => {
        const map = new Map<string, MealSlot[]>();
        for (const s of slots) {
            const key = formatISODate(new Date(s.date));
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
                            <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 transition-colors font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Admin
                            </Link>
                            <span className="text-slate-300">|</span>
                            <Link href={`/trips/${tripId}/admin`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 transition-colors font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Trip Admin
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-bold animate-gradient">{trip?.name ?? "Trip"}</h1>
                            {invite && <CopyInviteButton token={invite.token} />}
                        </div>
                        <div className="text-lg text-slate-600 font-medium">
                            {trip ? `${formatHumanDate(trip.startDate, locale)} → ${formatHumanDate(trip.endDate, locale)}` : ""}
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-600 font-medium">Cooks</label>
                                <input
                                    className="input w-16"
                                    type="number"
                                    min={1}
                                    max={6}
                                    value={cooksPerMeal}
                                    onChange={e => setCooksPerMeal(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-600 font-medium">Helpers</label>
                                <input
                                    className="input w-16"
                                    type="number"
                                    min={0}
                                    max={6}
                                    value={helpersPerMeal}
                                    onChange={e => setHelpersPerMeal(Math.max(0, Math.min(6, Number(e.target.value) || 0)))}
                                />
                            </div>
                            <FancyCheckbox label="Avoid consecutive" checked={avoidConsecutive} onChange={setAvoidConsecutive} />
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
                            <a className="btn btn-secondary" href={`/api/trips/${tripId}/schedule/ics`} target="_blank" rel="noreferrer">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    Export ICS
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat title="Participants" value={participantCount} />
                <Stat title="Meals" value={totalMeals} />
            </div>

            <nav className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 border border-white/50 shadow-lg slide-in-up">
                <div className="flex flex-wrap gap-2">
                    {(["plan", "recipes", "team"] as const).map((t, index) => (
                        <button
                            key={t}
                            className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                                tab === t
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 transform scale-105 bounce-in"
                                    : "text-slate-600 hover:text-purple-600 hover:bg-white/70 hover:shadow-md hover:scale-105"
                            }`}
                            onClick={() => setTab(t)}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {t[0].toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
            </nav>

            {tab === "plan" && (
                <section className="card space-y-6">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Trip Summary</h2>
                        </div>
                        <button className="btn btn-secondary" onClick={() => typeof window !== "undefined" && window.print()}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                            </svg>
                            Print Summary
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
                                            <li
                                                key={s.id}
                                                className="border border-slate-200/50 rounded-xl p-4 bg-gradient-to-br from-white to-slate-50/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-200 cursor-pointer group"
                                                onClick={e => {
                                                    e.preventDefault();
                                                    if (e.ctrlKey || e.metaKey) {
                                                        window.open(`/meals/${s.id}`, "_blank");
                                                    } else {
                                                        router.push(`/meals/${s.id}`);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                            s.mealType === "BREAKFAST"
                                                                ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                                                                : s.mealType === "LUNCH"
                                                                ? "bg-gradient-to-r from-orange-400 to-amber-500"
                                                                : "bg-gradient-to-r from-purple-500 to-indigo-600"
                                                        }`}
                                                    >
                                                        {s.mealType === "BREAKFAST" && <span className="text-white text-lg">🌅</span>}
                                                        {s.mealType === "LUNCH" && <span className="text-white text-lg">☀️</span>}
                                                        {s.mealType === "DINNER" && <span className="text-white text-lg">🌙</span>}
                                                    </div>
                                                    <div className="text-base font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">{s.mealType}</div>
                                                </div>
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                            />
                                                        </svg>
                                                        <span>Recipes: {recipeTitles(s) || "Not assigned"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                            />
                                                        </svg>
                                                        <span>Cooks: {cooksFor(s) || "Not assigned"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                            />
                                                        </svg>
                                                        <span>Helpers: {helpersFor(s) || "Not assigned"}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                                                    <div className="text-xs text-slate-400 group-hover:text-purple-500 transition-colors">Click to view details</div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
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
                                        {r.notes ? ` — ${r.notes}` : ""}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            )}

            {tab === "team" && (
                <section className="card space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Participants</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="relative">
                            <input className="input w-full pl-8!" placeholder="Participant name" value={participantsName} onChange={e => setParticipantsName(e.target.value)} />
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                        <div className="relative">
                            <select className="input w-full appearance-none pr-10" value={preference} onChange={e => setPreference(parseInt(e.target.value))}>
                                <option value={2}>🔥 Loves cooking</option>
                                <option value={1}>😊 Enjoys cooking</option>
                                <option value={0}>😐 Neutral</option>
                                <option value={-1}>😕 Prefers not to</option>
                                <option value={-2}>😤 Hates cooking</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
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

                    <ul className="divide-y divide-slate-100">
                        {participants.map(p => (
                            <li key={p.id} className="py-4 flex items-center justify-between hover:bg-slate-50/50 rounded-lg px-4 -mx-4 transition-colors">
                                <div className="min-w-0 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-800">{p.name}</div>
                                        <div className="text-sm text-slate-600 flex items-center gap-2">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                    />
                                                </svg>
                                                Pref: {p.cookingPreference}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                {p.availabilities.length > 0 ? `${p.availabilities.length} days available` : "No availability set"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="shrink-0 flex gap-2">
                                    <Link href={`/participants/${p.id}`} className="btn btn-secondary">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                        </svg>
                                        Edit
                                    </Link>
                                    <button
                                        className="btn btn-secondary hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                                        onClick={async () => {
                                            if (!confirm(`Remove ${p.name} from trip?`)) return;
                                            await fetch(`/api/participants/${p.id}`, { method: "DELETE" });
                                            await refreshParticipants();
                                            await refreshSchedule();
                                        }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                        {participants.length === 0 && (
                            <li className="py-8 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-700">No participants yet</div>
                                        <div className="text-xs text-slate-500">Add participants using the form above</div>
                                    </div>
                                </div>
                            </li>
                        )}
                    </ul>
                </section>
            )}

            {tab === "recipes" && (
                <section className="space-y-6">
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                        />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">Recipe Planner</h2>
                            </div>
                            <div className="text-sm text-slate-600">
                                {recipes.length} recipes • {slots.filter(s => (s.recipes ?? []).length > 0).length}/{slots.length} meals planned
                            </div>
                        </div>

                        {/* Recipe Library */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/50 mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <h3 className="font-semibold text-amber-800">Recipe Library</h3>
                                </div>
                                <span className="text-xs text-amber-600">Click any recipe to see assignment options</span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {recipes.map(recipe => (
                                    <RecipeLibraryCard
                                        key={recipe.id}
                                        recipe={recipe}
                                        slots={slots}
                                        onAssign={async () => {
                                            await refreshSchedule();
                                            await refreshRecipes();
                                        }}
                                        onEdit={() => openEditRecipe(recipe)}
                                    />
                                ))}
                                <NewRecipeCard onClick={() => setShowRecipeModal(true)} />
                            </div>
                        </div>

                        {/* Meal Planning Grid */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Meal Planning
                            </h3>
                            <div className="space-y-4">
                                {[...slotsByDate.entries()].map(([date, mealSlots]) => (
                                    <MealPlanningDay
                                        key={date}
                                        date={date}
                                        slots={mealSlots}
                                        recipes={recipes}
                                        onChanged={async () => {
                                            await refreshSchedule();
                                            await refreshRecipes();
                                        }}
                                    />
                                ))}
                                {slots.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-medium text-slate-700 mb-2">No meals yet</h4>
                                        <p className="text-sm text-slate-500">Add meals in the Schedule tab to start planning recipes</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {false && (
                <section className="card space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Schedule Management</h2>
                    </div>

                    {/* Add New Meals Section */}
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-200/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">Add New Meals</h3>
                        </div>
                        <MealAdder onAdd={(date, meals) => addDay(date, meals)} />
                        {days.length > 0 ? (
                            <div className="text-sm text-slate-600 mt-3">Pending days: {days.map(d => `${d.date} [${d.mealTypes.join(", ")}]`).join(", ")}</div>
                        ) : (
                            <div className="text-sm text-slate-500 mt-3">Select a date and choose meals to add.</div>
                        )}
                        <button className="btn btn-primary mt-3" onClick={submitMeals} disabled={isSubmittingMeals}>
                            {isSubmittingMeals ? (
                                <div className="flex items-center gap-2">
                                    <Loader size="sm" />
                                    Saving...
                                </div>
                            ) : (
                                "Save meals"
                            )}
                        </button>
                    </div>
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

            <section className="card space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13a2 2 0 100 4 2 2 0 000-4zM9 19a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Grocery List</h2>
                </div>
                <div className="flex gap-3">
                    <input className="input" type="date" value={groceriesDate} onChange={e => setGroceriesDate(e.target.value)} />
                    <button className="btn btn-primary" onClick={() => generateGroceries(true)} disabled={isGeneratingGroceries || !groceriesDate}>
                        {isGeneratingGroceries ? (
                            <div className="flex items-center gap-2">
                                <Loader size="sm" />
                                Generating...
                            </div>
                        ) : (
                            "Generate for Participants"
                        )}
                    </button>
                </div>
                {groceries.length > 0 && grocerySummary && (
                    <GrocerySummary summary={grocerySummary} groceries={groceries} />
                )}
            </section>

            {/* Recipe Edit Modal */}
            {showEditRecipeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Edit Recipe</h3>
                            <button 
                                className="text-slate-400 hover:text-slate-600 p-1"
                                onClick={() => setShowEditRecipeModal(false)}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Recipe Name *</label>
                                <input 
                                    className="input w-full" 
                                    placeholder="e.g., Pasta Carbonara" 
                                    value={editRecipeTitle}
                                    onChange={(e) => setEditRecipeTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                                <textarea 
                                    className="input w-full h-20 resize-none" 
                                    placeholder="Preparation notes, dietary restrictions, etc."
                                    value={editRecipeNotes}
                                    onChange={(e) => setEditRecipeNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button 
                                className="btn btn-secondary hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                                onClick={deleteRecipe}
                                disabled={isEditingRecipe || isDeletingRecipe}
                                title="Delete recipe"
                            >
                                {isDeletingRecipe ? (
                                    <div className="flex items-center gap-2">
                                        <Loader size="sm" />
                                        Deleting...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </div>
                                )}
                            </button>
                            <button 
                                className="btn btn-secondary flex-1"
                                onClick={() => setShowEditRecipeModal(false)}
                                disabled={isEditingRecipe || isDeletingRecipe}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary flex-1"
                                onClick={saveRecipeEdit}
                                disabled={!editRecipeTitle.trim() || isEditingRecipe || isDeletingRecipe}
                            >
                                {isEditingRecipe ? (
                                    <div className="flex items-center gap-2">
                                        <Loader size="sm" />
                                        Saving...
                                    </div>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recipe Creation Modal */}
            {showRecipeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Create New Recipe</h3>
                            <button 
                                className="text-slate-400 hover:text-slate-600 p-1"
                                onClick={() => setShowRecipeModal(false)}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Recipe Name *</label>
                                <input 
                                    className="input w-full" 
                                    placeholder="e.g., Pasta Carbonara" 
                                    value={newRecipeTitle}
                                    onChange={(e) => setNewRecipeTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                                <textarea 
                                    className="input w-full h-20 resize-none" 
                                    placeholder="Preparation notes, dietary restrictions, etc."
                                    value={newRecipeNotes}
                                    onChange={(e) => setNewRecipeNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button 
                                className="btn btn-secondary flex-1"
                                onClick={() => setShowRecipeModal(false)}
                                disabled={isCreatingRecipe}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary flex-1"
                                onClick={createRecipe}
                                disabled={!newRecipeTitle.trim() || isCreatingRecipe}
                            >
                                {isCreatingRecipe ? (
                                    <div className="flex items-center gap-2">
                                        <Loader size="sm" />
                                        Creating...
                                    </div>
                                ) : (
                                    "Create Recipe"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
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
    const getIcon = (title: string) => {
        switch (title.toLowerCase()) {
            case "participants":
                return <UsersIcon className="w-5 h-5" />;
            case "meals":
                return <UtensilsIcon className="w-5 h-5" />;
            case "recipes":
                return <BookOpenIcon className="w-5 h-5" />;
            default:
                return <BarChart3Icon className="w-5 h-5" />;
        }
    };

    const getGradient = (title: string) => {
        switch (title.toLowerCase()) {
            case "participants":
                return "from-blue-500 to-indigo-500";
            case "meals":
                return "from-orange-500 to-red-500";
            case "recipes":
                return "from-yellow-500 to-orange-500";
            default:
                return "from-purple-500 to-pink-500";
        }
    };

    return (
        <div className="group stat-card hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">{title}</div>
                <div
                    className={`w-8 h-8 bg-gradient-to-r ${getGradient(
                        title
                    )} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}
                >
                    {getIcon(title)}
                </div>
            </div>
            <div className="text-3xl font-bold text-slate-700">{value}</div>
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
    const locale = useLocale();
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
                        <FancyCheckbox label={formatHumanYmd(d, locale)} checked={!!selected[d]} onChange={() => toggle(d)} />
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
    const [dateYmd, setDateYmd] = useState<string>(formatISODate(new Date(slot.date)));
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
                            setDateYmd(formatISODate(new Date(slot.date)));
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

function RecipeLibraryCard({ 
    recipe, 
    slots, 
    onAssign,
    onEdit
}: { 
    recipe: { id: string; title: string; notes?: string | null; serves?: number | null }; 
    slots: MealSlot[]; 
    onAssign: () => Promise<void>; 
    onEdit: () => void;
}) {
    const [showAssign, setShowAssign] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);

    const assignedSlots = slots.filter(s => (s.recipes ?? []).some(r => r.recipe.id === recipe.id));
    const availableSlots = slots.filter(s => !(s.recipes ?? []).some(r => r.recipe.id === recipe.id));

    async function handleAssign() {
        if (selectedSlots.length === 0) return;
        setBusy(true);
        try {
            await Promise.all(
                selectedSlots.map(slotId => 
                    fetch(`/api/meals/${slotId}/recipes/${encodeURIComponent(recipe.id)}`, { method: "PUT" })
                )
            );
            setSelectedSlots([]);
            setShowAssign(false);
            await onAssign();
        } finally {
            setBusy(false);
        }
    }

    if (showAssign) {
        return (
            <div className="bg-white border border-amber-300 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-800 truncate">{recipe.title}</div>
                    <button 
                        className="text-slate-400 hover:text-slate-600" 
                        onClick={() => setShowAssign(false)}
                    >
                        ✕
                    </button>
                </div>
                <div className="space-y-2">
                    <div className="text-xs text-slate-600">Assign to meals:</div>
                    <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                        {availableSlots.map(slot => (
                            <label key={slot.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 p-1 rounded">
                                <input
                                    type="checkbox"
                                    checked={selectedSlots.includes(slot.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedSlots(prev => [...prev, slot.id]);
                                        } else {
                                            setSelectedSlots(prev => prev.filter(id => id !== slot.id));
                                        }
                                    }}
                                    className="w-3 h-3 text-amber-600"
                                />
                                <span>{formatHumanDate(slot.date, locale)} - {slot.mealType}</span>
                            </label>
                        ))}
                        {availableSlots.length === 0 && (
                            <div className="text-xs text-slate-500 py-2">All meals already have this recipe</div>
                        )}
                    </div>
                </div>
                <button 
                    className="btn btn-primary w-full text-xs py-1"
                    onClick={handleAssign}
                    disabled={selectedSlots.length === 0 || busy}
                >
                    {busy ? "Assigning..." : `Assign to ${selectedSlots.length} meals`}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white border border-amber-200 rounded-lg p-3 hover:border-amber-300 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-1">
                <div className="font-medium text-slate-800 truncate flex-1 pr-2">{recipe.title}</div>
                <button
                    className="text-slate-400 hover:text-slate-600 p-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    title="Edit recipe"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Auto-calculated portions</span>
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {assignedSlots.length} assigned
                </span>
            </div>
            {recipe.notes && (
                <div className="text-xs text-slate-400 mb-2 truncate">{recipe.notes}</div>
            )}
            <button 
                className="w-full text-xs text-amber-600 hover:text-amber-700 py-1 px-2 rounded border border-amber-200 hover:border-amber-300 transition-colors"
                onClick={() => setShowAssign(true)}
            >
                Assign to meals
            </button>
        </div>
    );
}

function NewRecipeCard({ onClick }: { onClick: () => void }) {
    return (
        <div 
            className="bg-white border-2 border-dashed border-amber-200 rounded-lg p-3 cursor-pointer hover:border-amber-300 transition-all flex flex-col items-center justify-center min-h-[80px] text-slate-500 hover:text-slate-700"
            onClick={onClick}
        >
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </div>
            <div className="text-sm font-medium">Add Recipe</div>
            <div className="text-xs">Click to create new</div>
        </div>
    );
}

function MealPlanningDay({ 
    date, 
    slots, 
    recipes, 
    onChanged 
}: { 
    date: string; 
    slots: MealSlot[]; 
    recipes: Array<{ id: string; title: string; notes?: string | null; serves?: number | null }>;
    onChanged: () => Promise<void>; 
}) {
    const locale = useLocale();

    return (
        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/50">
            <div className="flex items-center gap-3 mb-4">
                <div className="text-lg font-semibold text-slate-800">
                    {formatHumanYmd(date, locale)}
                </div>
                <div className="text-sm text-slate-500">
                    {slots.length} meals • {slots.filter(s => (s.recipes ?? []).length > 0).length} planned
                </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
                {slots.map(slot => (
                    <MealPlanningCard 
                        key={slot.id} 
                        slot={slot} 
                        recipes={recipes}
                        onChanged={onChanged} 
                    />
                ))}
            </div>
        </div>
    );
}

function MealPlanningCard({ 
    slot, 
    recipes, 
    onChanged 
}: { 
    slot: MealSlot; 
    recipes: Array<{ id: string; title: string; notes?: string | null; serves?: number | null }>;
    onChanged: () => Promise<void>; 
}) {
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [busy, setBusy] = useState(false);

    const assignedRecipes = slot.recipes ?? [];
    const availableRecipes = recipes.filter(r => !assignedRecipes.some(ar => ar.recipe.id === r.id));

    const getMealIcon = () => {
        switch (slot.mealType) {
            case "BREAKFAST": return "🌅";
            case "LUNCH": return "☀️";  
            case "DINNER": return "🌙";
        }
    };

    const getMealGradient = () => {
        switch (slot.mealType) {
            case "BREAKFAST": return "from-amber-400 to-yellow-500";
            case "LUNCH": return "from-orange-400 to-amber-500";
            case "DINNER": return "from-purple-500 to-indigo-600";
        }
    };

    async function assignRecipe(recipeId: string) {
        setBusy(true);
        try {
            await fetch(`/api/meals/${slot.id}/recipes/${encodeURIComponent(recipeId)}`, { method: "PUT" });
            await onChanged();
            setShowQuickAdd(false);
        } finally {
            setBusy(false);
        }
    }

    async function removeRecipe(recipeId: string) {
        setBusy(true);
        try {
            await fetch(`/api/meals/${slot.id}/recipes/${encodeURIComponent(recipeId)}`, { method: "DELETE" });
            await onChanged();
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r ${getMealGradient()}`}>
                    <span className="text-white text-lg">{getMealIcon()}</span>
                </div>
                <div className="font-semibold text-slate-800">{slot.mealType}</div>
            </div>

            <div className="space-y-2">
                {assignedRecipes.length > 0 ? (
                    assignedRecipes.map(({ recipe }) => (
                        <div key={recipe.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2">
                            <div className="min-w-0">
                                <div className="font-medium text-green-800 text-sm truncate">{recipe.title}</div>
                            </div>
                            <button 
                                className="text-green-600 hover:text-red-600 text-xs underline ml-2"
                                onClick={() => removeRecipe(recipe.id)}
                                disabled={busy}
                            >
                                remove
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                        <div className="text-sm">No recipes assigned</div>
                    </div>
                )}
            </div>

            {!showQuickAdd ? (
                <button 
                    className="btn btn-secondary w-full text-sm py-2"
                    onClick={() => setShowQuickAdd(true)}
                    disabled={availableRecipes.length === 0}
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {availableRecipes.length === 0 ? "All recipes assigned" : "Add Recipe"}
                </button>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-700">Quick Assign</div>
                        <button 
                            className="text-slate-400 hover:text-slate-600"
                            onClick={() => setShowQuickAdd(false)}
                        >
                            ✕
                        </button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {availableRecipes.map(recipe => (
                            <button
                                key={recipe.id}
                                className="w-full text-left p-2 text-sm border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                                onClick={() => assignRecipe(recipe.id)}
                                disabled={busy}
                            >
                                <div className="font-medium text-slate-800">{recipe.title}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
