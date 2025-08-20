import { useState } from 'react';
import { useTranslations } from 'next-intl';

type GrocerySummaryData = {
    participantCount: number;
    meals: Array<{ mealType: string; recipes: Array<{ title: string; serves?: number | null }> }>;
    servingsMultiplier: number;
    mealGroceries?: Array<{
        mealType: string;
        items: Array<{ name: string; quantity?: string; category?: string }>;
    }>;
};

type GrocerySummaryProps = {
    summary: GrocerySummaryData;
    groceries: Array<{ name: string; quantity?: string; category?: string }>;
    showShoppingList?: boolean;
};

export default function GrocerySummary({ summary, groceries, showShoppingList = true }: GrocerySummaryProps) {
    const t = useTranslations('GrocerySummary');
    const [activeTab, setActiveTab] = useState<'all' | 'by-meal' | 'by-category'>('all');
    
    // Group groceries by category
    const groceriesByCategory = groceries.reduce((acc, item) => {
        const category = item.category || t('categoryOther');
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {} as Record<string, Array<{ name: string; quantity?: string; category?: string }>>);

    // Use meal-specific groceries if available, otherwise fall back to consolidated list
    const mealGroceries = summary.mealGroceries && summary.mealGroceries.length > 0 
        ? summary.mealGroceries 
        : summary.meals.map(meal => ({
            mealType: meal.mealType,
            items: groceries // Fallback to showing all items for each meal
        }));

    return (
        <div className="space-y-6">
            {/* Summary Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h4 className="font-semibold text-blue-800">{t('title')}</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <span className="font-medium text-blue-800">{t('participants')}</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{summary.participantCount}</div>
                        <div className="text-xs text-blue-600">{t('peopleAvailable')}</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L6 5M17 4l1 1m-2 0v11a2 2 0 01-2 2H8a2 2 0 01-2-2V5m6 2v8m0-8h4m-4 0H9" />
                            </svg>
                            <span className="font-medium text-blue-800">{t('servingsMultiplier')}</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{summary.servingsMultiplier.toFixed(1)}×</div>
                        <div className="text-xs text-blue-600">{t('portionAdjustment')}</div>
                    </div>
                </div>
                
                {/* Meals breakdown */}
                <div className="mt-4">
                    <div className="font-medium text-blue-800 mb-2">{t('mealsForDay')}</div>
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
                                                    <span className="text-blue-500"> ({t('serves', { count: recipe.serves })})</span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-blue-500 italic">{t('noRecipesAssigned')}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Shopping List with Tabs */}
            {showShoppingList && groceries.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-800">{t('shoppingList')}</h4>
                        <div className="text-sm text-slate-500">{t('itemsCount', { count: groceries.length })}</div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-1 p-1 bg-slate-100 rounded-lg mb-4">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
                                activeTab === 'all'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {t('tabAll')}
                        </button>
                        <button
                            onClick={() => setActiveTab('by-meal')}
                            className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
                                activeTab === 'by-meal'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {t('tabByMeal')}
                        </button>
                        <button
                            onClick={() => setActiveTab('by-category')}
                            className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
                                activeTab === 'by-category'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {t('tabByCategory')}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-4">
                        {activeTab === 'all' && (
                            <ul className="space-y-2">
                                {groceries.map((item, idx) => (
                                    <li key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 hover:bg-slate-50 rounded-lg gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 border border-slate-300 rounded flex-shrink-0"></div>
                                            <span className="text-slate-700">{item.name}</span>
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-2 sm:ml-auto">
                                            {item.quantity && <span>{item.quantity}</span>}
                                            {item.category && <span className="bg-slate-100 px-2 py-1 rounded text-xs">{item.category}</span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {activeTab === 'by-meal' && (
                            <div className="space-y-4">
                                {mealGroceries.filter(meal => meal.items.length > 0).map((meal, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-lg">
                                                {meal.mealType === "BREAKFAST" && "🌅"}
                                                {meal.mealType === "LUNCH" && "☀️"}
                                                {meal.mealType === "DINNER" && "🌙"}
                                            </span>
                                            <h5 className="font-medium text-slate-800">{meal.mealType}</h5>
                                             <span className="text-sm text-slate-500">{t('itemsParen', { count: meal.items.length })}</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {meal.items.map((item, itemIdx) => (
                                                <li key={itemIdx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 border border-slate-300 rounded"></div>
                                                        <span className="text-slate-700">{item.name}</span>
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        {item.quantity && <span className="mr-2">{item.quantity}</span>}
                                                        {item.category && <span className="bg-slate-100 px-2 py-1 rounded text-xs">{item.category}</span>}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'by-category' && (
                            <div className="space-y-4">
                                {Object.entries(groceriesByCategory).map(([category, items]) => (
                                    <div key={category} className="border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-medium text-slate-800">{category}</h5>
                                             <span className="text-sm text-slate-500">{t('itemsParen', { count: items.length })}</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {items.map((item, idx) => (
                                                <li key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 border border-slate-300 rounded"></div>
                                                        <span className="text-slate-700">{item.name}</span>
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        {item.quantity && <span>{item.quantity}</span>}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export type { GrocerySummaryData };