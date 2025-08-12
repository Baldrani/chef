type GrocerySummaryData = {
    participantCount: number;
    meals: Array<{ mealType: string; recipes: Array<{ title: string; serves?: number | null }> }>;
    servingsMultiplier: number;
};

type GrocerySummaryProps = {
    summary: GrocerySummaryData;
    groceries: Array<{ name: string; quantity?: string; category?: string }>;
    showShoppingList?: boolean;
};

export default function GrocerySummary({ summary, groceries, showShoppingList = true }: GrocerySummaryProps) {
    return (
        <div className="space-y-6">
            {/* Summary Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h4 className="font-semibold text-blue-800">Grocery Summary</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <span className="font-medium text-blue-800">Participants</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{summary.participantCount}</div>
                        <div className="text-xs text-blue-600">people available</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L6 5M17 4l1 1m-2 0v11a2 2 0 01-2 2H8a2 2 0 01-2-2V5m6 2v8m0-8h4m-4 0H9" />
                            </svg>
                            <span className="font-medium text-blue-800">Servings Multiplier</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{summary.servingsMultiplier.toFixed(1)}×</div>
                        <div className="text-xs text-blue-600">portion adjustment</div>
                    </div>
                </div>
                
                {/* Meals breakdown */}
                <div className="mt-4">
                    <div className="font-medium text-blue-800 mb-2">Meals for this day:</div>
                    <div className="space-y-2">
                        {summary.meals.map((meal, idx) => (
                            <div key={idx} className="bg-white/60 rounded-lg p-3 border border-blue-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">
                                        {meal.mealType === "BREAKFAST" && "🌅"}
                                        {meal.mealType === "LUNCH" && "☀️"}
                                        {meal.mealType === "DINNER" && "🌙"}
                                    </span>
                                    <span className="font-medium text-blue-800">{meal.mealType}</span>
                                </div>
                                <div className="text-xs text-blue-700">
                                    {meal.recipes.length > 0 ? (
                                        meal.recipes.map((recipe, recipeIdx) => (
                                            <div key={recipeIdx}>
                                                {recipe.title}
                                                {recipe.serves && (
                                                    <span className="text-blue-500"> (serves {recipe.serves})</span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-blue-500 italic">No recipes assigned</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grocery Items List */}
            {showShoppingList && groceries.length > 0 && (
                <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Shopping List</h4>
                    <ul className="list-disc pl-6 text-slate-700">
                        {groceries.map((i, idx) => (
                            <li key={idx}>
                                {i.name}
                                {i.quantity ? ` — ${i.quantity}` : ""}
                                {i.category ? ` (${i.category})` : ""}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export type { GrocerySummaryData };