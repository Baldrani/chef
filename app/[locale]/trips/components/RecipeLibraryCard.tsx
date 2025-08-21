"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { formatHumanDate } from "@/lib/dates";

type MealSlot = {
    id: string;
    date: string;
    mealType: "BREAKFAST" | "LUNCH" | "DINNER";
    assignments?: { participant: { id: string; name: string }; role: "COOK" | "HELPER" }[];
    recipes?: { recipe: { id: string; title: string } }[];
};

interface RecipeLibraryCardProps {
    recipe: { id: string; title: string; notes?: string | null; serves?: number | null };
    slots: MealSlot[];
    onAssign: () => Promise<void>;
    onEdit: () => void;
}

export function RecipeLibraryCard({ recipe, slots, onAssign, onEdit }: RecipeLibraryCardProps) {
    const locale = useLocale();
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