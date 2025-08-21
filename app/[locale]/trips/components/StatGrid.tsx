"use client";

import {
    Users as UsersIcon,
    Utensils as UtensilsIcon,
    BookOpen as BookOpenIcon,
    BarChart3 as BarChart3Icon,
} from "lucide-react";

interface StatGridProps {
    participantCount: number;
    totalMeals: number;
    recipesCount: number;
    tripDaysSet: Set<string>;
}

export function StatGrid({ participantCount, totalMeals, recipesCount, tripDaysSet }: StatGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat title="Participants" value={participantCount} />
            <Stat title="Meals" value={totalMeals} />
            <Stat title="Recipes" value={recipesCount} />
            <Stat title="Days" value={tripDaysSet.size} />
        </div>
    );
}

function Stat({ title, value }: { title: string; value: string | number }) {
    const getIcon = (title: string) => {
        switch (title.toLowerCase()) {
            case "participants":
                return <UsersIcon className="w-5 h-5" />;
            case "meals":
                return <UtensilsIcon className="w-5 h-5" />;
            case "recipes":
                return <BookOpenIcon className="w-5 h-5" />;
            default:
                return <BarChart3Icon className="w-5 h-5" />;
        }
    };

    const getGradient = (title: string) => {
        switch (title.toLowerCase()) {
            case "participants":
                return "from-blue-500 to-indigo-500";
            case "meals":
                return "from-orange-500 to-red-500";
            case "recipes":
                return "from-yellow-500 to-orange-500";
            default:
                return "from-purple-500 to-pink-500";
        }
    };

    return (
        <div className="group stat-card hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">{title}</div>
                <div
                    className={`w-8 h-8 bg-gradient-to-r ${getGradient(
                        title
                    )} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}
                >
                    {getIcon(title)}
                </div>
            </div>
            <div className="text-3xl font-bold text-slate-700">{value}</div>
        </div>
    );
}