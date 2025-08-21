"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { formatHumanDate, formatHumanYmd } from "@/lib/dates";
import Loader from "@/app/components/Loader";
import { RecipeLibraryCard } from "./RecipeLibraryCard";
import { NewRecipeCard } from "./NewRecipeCard";
import { MealPlanningDay } from "./MealPlanningDay";
import {
    Library,
    Calendar,
    Plus,
    X,
    Trash,
} from "lucide-react";
import { toast } from "sonner";

type MealSlot = {
    id: string;
    date: string;
    mealType: "BREAKFAST" | "LUNCH" | "DINNER";
    assignments?: { participant: { id: string; name: string }; role: "COOK" | "HELPER" }[];
    recipes?: { recipe: { id: string; title: string } }[];
};

interface RecipesTabProps {
    tripId: string;
    recipes: Array<{ id: string; title: string; notes?: string | null; serves?: number | null }>;
    slots: MealSlot[];
    slotsByDate: Map<string, MealSlot[]>;
    onRecipeRefresh: () => Promise<void>;
    onScheduleRefresh: () => Promise<void>;
}

export function RecipesTab({ 
    tripId, 
    recipes, 
    slots, 
    slotsByDate, 
    onRecipeRefresh, 
    onScheduleRefresh 
}: RecipesTabProps) {
    const locale = useLocale();
    
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
            await onRecipeRefresh();
            await onScheduleRefresh();
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
            await onRecipeRefresh();
            await onScheduleRefresh();
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
            await onRecipeRefresh();
            await onScheduleRefresh();
        } finally {
            setIsDeletingRecipe(false);
        }
    }

    return (
        <>
            <section className="space-y-6">
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                                <Library className="w-6 h-6 text-white" />
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
                            <Library className="w-5 h-5 text-amber-600" />
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
                                        await onScheduleRefresh();
                                        await onRecipeRefresh();
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
                            <Calendar className="w-5 h-5 text-slate-600" />
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
                                        await onScheduleRefresh();
                                        await onRecipeRefresh();
                                    }}
                                />
                            ))}
                            {slots.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Plus className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h4 className="text-lg font-medium text-slate-700 mb-2">No meals yet</h4>
                                    <p className="text-sm text-slate-500">Add meals in the Schedule tab to start planning recipes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
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
                                <X className="w-6 h-6" />
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
                                        <Trash className="w-4 h-4" />
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
                                <X className="w-6 h-6" />
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
        </>
    );
}