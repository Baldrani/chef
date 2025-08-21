"use client";

import { useLocale } from "next-intl";
import { formatHumanYmd } from "@/lib/dates";
import { MealPlanningCard } from "./MealPlanningCard";

type MealSlot = {
    id: string;
    date: string;
    mealType: "BREAKFAST" | "LUNCH" | "DINNER";
    assignments?: { participant: { id: string; name: string }; role: "COOK" | "HELPER" }[];
    recipes?: { recipe: { id: string; title: string } }[];
};

interface MealPlanningDayProps {
    date: string;
    slots: MealSlot[];
    recipes: Array<{ id: string; title: string; notes?: string | null; serves?: number | null }>;
    onChanged: () => Promise<void>;
}

export function MealPlanningDay({ date, slots, recipes, onChanged }: MealPlanningDayProps) {
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