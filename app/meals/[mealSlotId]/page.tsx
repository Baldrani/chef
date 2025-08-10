"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { formatHumanDate } from "@/lib/dates";
import Loader from "@/app/components/Loader";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

type Participant = { id: string; name: string };
type Assignment = { participant: Participant; role: "COOK" | "HELPER" };
type Recipe = { id: string; title: string; serves?: number | null; notes?: string | null };

type Meal = {
    id: string;
    tripId: string;
    date: string;
    mealType: MealType;
    assignments?: Assignment[];
    recipes?: { recipe: Recipe }[];
};

export default function MealPage() {
    const params = useParams<{ mealSlotId: string }>();
    const mealSlotId = params?.mealSlotId as string;
    const locale = useLocale();

    const [meal, setMeal] = useState<Meal | null>(null);
    const [loading, setLoading] = useState(true);

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

    const cooks = useMemo(() => (meal?.assignments ?? []).filter(a => a.role === "COOK"), [meal]);
    const helpers = useMemo(() => (meal?.assignments ?? []).filter(a => a.role === "HELPER"), [meal]);

    if (loading) {
        return (
            <div className="p-4">
                <Loader size="lg" text="Loading meal details..." className="py-20" />
            </div>
        );
    }
    
    if (!meal) {
        return <div className="p-4 text-center text-slate-500">Meal not found</div>;
    }

    return (
        <div className="p-4 space-y-4">
            <div>
                <Link href={`/trips/${meal.tripId}`} className="underline">
                    Back
                </Link>
            </div>
            <div className="card">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="font-medium">{meal.mealType}</div>
                        <div className="text-xs text-slate-600">{formatHumanDate(meal.date, locale)}</div>
                    </div>
                </div>
                <div className="text-sm text-slate-600 mt-2">Cooks: {cooks.length ? cooks.map(a => a.participant.name).join(", ") : "-"}</div>
                <div className="text-sm text-slate-600">Helpers: {helpers.length ? helpers.map(a => a.participant.name).join(", ") : "-"}</div>
                <div className="text-sm text-slate-600">Recipes: {(meal.recipes ?? []).map(r => r.recipe.title).join(", ") || "-"}</div>
            </div>
        </div>
    );
}
