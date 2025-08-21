"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { formatHumanDate, formatHumanYmd } from "@/lib/dates";
import { StatGrid } from "./StatGrid";
import { MealAdder } from "./MealAdder";
import Loader from "@/app/components/Loader";
import {
    Users as UsersIcon,
    Utensils as UtensilsIcon,
    BookOpen as BookOpenIcon,
    BarChart3 as BarChart3Icon,
    Printer,
    Plus,
    ExternalLink,
} from "lucide-react";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

type MealSlot = {
    id: string;
    date: string;
    mealType: MealType;
    assignments?: { participant: { id: string; name: string }; role: "COOK" | "HELPER" }[];
    recipes?: { recipe: { id: string; title: string } }[];
};

type Trip = { id: string; name: string; startDate: string; endDate: string };

interface PlanTabProps {
    trip: Trip | null;
    tripId: string;
    slots: MealSlot[];
    slotsByDate: Map<string, MealSlot[]>;
    recipes: Array<{ id: string; title: string; notes?: string | null; serves?: number | null }>;
    participantCount: number;
    totalMeals: number;
    tripDaysSet: Set<string>;
    onScheduleRefresh: () => Promise<void>;
}

export function PlanTab({ 
    trip, 
    tripId, 
    slots, 
    slotsByDate, 
    recipes, 
    participantCount, 
    totalMeals, 
    tripDaysSet, 
    onScheduleRefresh 
}: PlanTabProps) {
    const locale = useLocale();
    const router = useRouter();
    const [days, setDays] = useState<{ date: string; mealTypes: MealType[] }[]>([]);
    const [isSubmittingMeals, setIsSubmittingMeals] = useState(false);

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
            await onScheduleRefresh();
        } finally {
            setIsSubmittingMeals(false);
        }
    }

    return (
        <section className="card space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <BarChart3Icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Trip Summary</h2>
                </div>
                <button className="btn btn-secondary" onClick={() => typeof window !== "undefined" && window.print()}>
                    <Printer className="w-4 h-4" />
                    Print Summary
                </button>
            </div>

            <StatGrid 
                participantCount={participantCount}
                totalMeals={totalMeals}
                recipesCount={recipes.length}
                tripDaysSet={tripDaysSet}
            />

            {/* Add New Meals Section */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">Add New Meals</h3>
                </div>
                <MealAdder onAdd={addDay} />
                {days.length > 0 ? (
                    <div className="text-sm text-slate-600 mt-3">
                        Pending meals: {days.map(d => `${formatHumanDate(d.date, locale)} [${d.mealTypes.join(", ")}]`).join(", ")}
                    </div>
                ) : (
                    <div className="text-sm text-slate-500 mt-3">Select a date and choose meal types to add.</div>
                )}
                <button className="btn btn-primary mt-4" onClick={submitMeals} disabled={isSubmittingMeals || days.length === 0}>
                    {isSubmittingMeals ? (
                        <div className="flex items-center gap-2">
                            <Loader size="sm" />
                            Saving meals...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add {days.length} meal{days.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </button>
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
                                                <BookOpenIcon className="w-3 h-3" />
                                                <span>Recipes: {recipeTitles(s) || "Not assigned"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <UsersIcon className="w-3 h-3" />
                                                <span>Cooks: {cooksFor(s) || "Not assigned"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <UsersIcon className="w-3 h-3" />
                                                <span>Helpers: {helpersFor(s) || "Not assigned"}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                                            <div className="text-xs text-slate-400 group-hover:text-purple-500 transition-colors">Click to view details</div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ExternalLink className="w-4 h-4 text-purple-500" />
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
    );
}