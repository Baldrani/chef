"use client";

import { useState } from "react";
import { toast } from "sonner";

type MealSlot = {
    id: string;
    date: string;
    mealType: "BREAKFAST" | "LUNCH" | "DINNER";
    assignments?: { participant: { id: string; name: string }; role: "COOK" | "HELPER" }[];
    recipes?: { recipe: { id: string; title: string } }[];
};

interface MealPlanningCardProps {
    slot: MealSlot;
    recipes: Array<{ id: string; title: string; notes?: string | null; serves?: number | null }>;
    onChanged: () => Promise<void>;
}

export function MealPlanningCard({ slot, recipes, onChanged }: MealPlanningCardProps) {
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [busy, setBusy] = useState(false);
    const [newRecipeName, setNewRecipeName] = useState("");
    const [isCreatingNew, setIsCreatingNew] = useState(false);

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

    async function createAndAssignNewRecipe() {
        if (!newRecipeName.trim()) return;
        setIsCreatingNew(true);
        try {
            // Extract tripId from the current URL path
            const pathSegments = window.location.pathname.split('/');
            const tripId = pathSegments[pathSegments.indexOf('trips') + 1];
            
            const response = await fetch(`/api/recipes`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ 
                    tripId, 
                    title: newRecipeName.trim(),
                    mealSlotId: slot.id
                }),
            });
            
            if (response.ok) {
                setNewRecipeName("");
                setShowQuickAdd(false);
                await onChanged();
                toast.success("Recipe created and assigned!");
            } else {
                toast.error("Failed to create recipe");
            }
        } finally {
            setIsCreatingNew(false);
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
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-700">Quick Assign</div>
                        <button 
                            className="text-slate-400 hover:text-slate-600"
                            onClick={() => {
                                setShowQuickAdd(false);
                                setNewRecipeName("");
                            }}
                        >
                            ✕
                        </button>
                    </div>
                    
                    {/* New Recipe Creation */}
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Create New Recipe</div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter new recipe name..."
                                value={newRecipeName}
                                onChange={(e) => setNewRecipeName(e.target.value)}
                                className="input flex-1 text-sm"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newRecipeName.trim()) {
                                        createAndAssignNewRecipe();
                                    }
                                }}
                                disabled={isCreatingNew}
                            />
                            <button
                                className="btn btn-primary text-xs px-3 py-2"
                                onClick={createAndAssignNewRecipe}
                                disabled={!newRecipeName.trim() || isCreatingNew}
                            >
                                {isCreatingNew ? "Creating..." : "Create & Add"}
                            </button>
                        </div>
                    </div>

                    {/* Existing Recipes */}
                    {availableRecipes.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Or Choose Existing</div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {availableRecipes.map(recipe => (
                                    <button
                                        key={recipe.id}
                                        className="w-full text-left p-2 text-sm border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                                        onClick={() => assignRecipe(recipe.id)}
                                        disabled={busy || isCreatingNew}
                                    >
                                        <div className="font-medium text-slate-800">{recipe.title}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}