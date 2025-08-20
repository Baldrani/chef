"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatHumanDate, formatISODate } from "@/lib/dates";
import Loader from "@/app/components/Loader";
import GrocerySummary, { type GrocerySummaryData } from "@/app/components/GrocerySummary";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

type Participant = { id: string; name: string };
type Assignment = { participant: Participant; role: "COOK" | "HELPER" };
type Recipe = { id: string; title: string; serves?: number | null; notes?: string | null };

type Meal = {
    id: string;
    tripId: string;
    date: string;
    mealType: MealType;
    startTime?: string | null;
    assignments?: Assignment[];
    recipes?: { recipe: Recipe }[];
};

export default function MealPage() {
    const params = useParams<{ mealSlotId: string }>();
    const mealSlotId = params?.mealSlotId as string;
    const locale = useLocale();
    const t = useTranslations('MealPage');

    const [meal, setMeal] = useState<Meal | null>(null);
    const [loading, setLoading] = useState(true);
    const [groceries, setGroceries] = useState<{ name: string; quantity?: string; category?: string }[]>([]);
    const [grocerySummary, setGrocerySummary] = useState<GrocerySummaryData | null>(null);
    const [isUpdatingTime, setIsUpdatingTime] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!mealSlotId) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/meals/${mealSlotId}`, { cache: "no-store" });
                if (!res.ok) return;
                const data = (await res.json()) as Meal;
                if (!cancelled) setMeal(data);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [mealSlotId]);

    // Fetch grocery data for the meal's date
    useEffect(() => {
        let cancelled = false;
        async function loadGroceries() {
            if (!meal?.tripId || !meal?.date) return;
            
            try {
                const dateStr = formatISODate(new Date(meal.date)); // Convert to YYYY-MM-DD
                const res = await fetch(`/api/groceries?tripId=${meal.tripId}&date=${dateStr}`, { 
                    cache: "no-store" 
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) {
                    setGroceries(data.items ?? []);
                    setGrocerySummary(data.summary ?? null);
                }
            } catch (error) {
                console.error('Failed to load groceries:', error);
            }
        }
        loadGroceries();
        return () => {
            cancelled = true;
        };
    }, [meal?.tripId, meal?.date]);

    const cooks = useMemo(() => (meal?.assignments ?? []).filter(a => a.role === "COOK"), [meal]);
    const helpers = useMemo(() => (meal?.assignments ?? []).filter(a => a.role === "HELPER"), [meal]);

    async function updateMealTime(newTime: string | null) {
        if (!meal) return;
        setIsUpdatingTime(true);
        try {
            const response = await fetch(`/api/meals/${meal.id}/time`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startTime: newTime })
            });
            
            if (response.ok) {
                const updatedMeal = await response.json();
                setMeal(updatedMeal);
            }
        } catch (error) {
            console.error('Failed to update meal time:', error);
        } finally {
            setIsUpdatingTime(false);
        }
    }

    if (loading) {
        return (
            <div className="p-4">
                <Loader size="lg" text={t('loading')} className="py-20" />
            </div>
        );
    }
    
    if (!meal) {
        return <div className="p-4 text-center text-slate-500">{t('notFound')}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <Link href={`/trips/${meal.tripId}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 transition-colors font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {t('backToTrip')}
                    </Link>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            meal.mealType === "BREAKFAST"
                                ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                                : meal.mealType === "LUNCH"
                                ? "bg-gradient-to-r from-orange-400 to-amber-500"
                                : "bg-gradient-to-r from-purple-500 to-indigo-600"
                        }`}>
                            {meal.mealType === "BREAKFAST" && <span className="text-white text-2xl">🌅</span>}
                            {meal.mealType === "LUNCH" && <span className="text-white text-2xl">☀️</span>}
                            {meal.mealType === "DINNER" && <span className="text-white text-2xl">🌙</span>}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">{meal.mealType}</h1>
                            <div className="text-lg text-slate-600">{formatHumanDate(meal.date, locale)}</div>
                        </div>
                    </div>

                    {/* Meal Time Picker */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-800">Meal Time</div>
                                    <div className="text-sm text-slate-600">
                                        {meal.startTime || "Using default time"}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    value={meal.startTime || ""}
                                    onChange={(e) => updateMealTime(e.target.value || null)}
                                    disabled={isUpdatingTime}
                                    className="input text-sm"
                                    title="Set custom meal time"
                                />
                                {meal.startTime && (
                                    <button
                                        onClick={() => updateMealTime(null)}
                                        disabled={isUpdatingTime}
                                        className="btn btn-secondary text-xs py-2 px-3"
                                        title="Reset to default time"
                                    >
                                        Reset
                                    </button>
                                )}
                                {isUpdatingTime && (
                                    <div className="text-xs text-slate-500">Updating...</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200/50">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="font-semibold text-blue-800">{t('cooks')}</span>
                            </div>
                            <div className="text-sm text-blue-700">
                                {cooks.length ? cooks.map(a => a.participant.name).join(", ") : t('notAssigned')}
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200/50">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="font-semibold text-green-800">{t('helpers')}</span>
                            </div>
                            <div className="text-sm text-green-700">
                                {helpers.length ? helpers.map(a => a.participant.name).join(", ") : t('notAssigned')}
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200/50">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className="font-semibold text-purple-800">{t('recipes')}</span>
                            </div>
                            <div className="text-sm text-purple-700">
                                {(meal.recipes ?? []).length ? (meal.recipes ?? []).map(r => r.recipe.title).join(", ") : t('notAssigned')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grocery Summary */}
            {groceries.length > 0 && grocerySummary && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13a2 2 0 100 4 2 2 0 000-4zM9 19a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{t('groceryListForDay')}</h2>
                    </div>
                    <GrocerySummary summary={grocerySummary} groceries={groceries} />
                </div>
            )}
        </div>
    );
}
