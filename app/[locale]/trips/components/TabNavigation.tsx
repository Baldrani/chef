"use client";

interface TabNavigationProps {
    tab: "plan" | "recipes" | "team" | "groceries";
    onTabChange: (tab: "plan" | "recipes" | "team" | "groceries") => void;
}

export function TabNavigation({ tab, onTabChange }: TabNavigationProps) {
    return (
        <nav className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 border border-white/50 shadow-lg slide-in-up">
            <div className="flex flex-wrap gap-2">
                {(["plan", "recipes", "team", "groceries"] as const).map((t, index) => (
                    <button
                        key={t}
                        className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                            tab === t
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 transform scale-105 bounce-in"
                                : "text-slate-600 hover:text-purple-600 hover:bg-white/70 hover:shadow-md hover:scale-105"
                        }`}
                        onClick={() => onTabChange(t)}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        {t[0].toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>
        </nav>
    );
}