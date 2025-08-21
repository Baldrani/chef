"use client";

interface NewRecipeCardProps {
    onClick: () => void;
}

export function NewRecipeCard({ onClick }: NewRecipeCardProps) {
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