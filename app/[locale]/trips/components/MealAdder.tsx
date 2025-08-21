"use client";

import { useState } from "react";
import FancyCheckbox from "@/app/components/FancyCheckbox";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

interface MealAdderProps {
    onAdd: (date: string, meals: MealType[]) => void;
}

export function MealAdder({ onAdd }: MealAdderProps) {
    const [date, setDate] = useState("");
    const [meals, setMeals] = useState<Record<MealType, boolean>>({ 
        BREAKFAST: false, 
        LUNCH: false, 
        DINNER: true 
    });

    function toggle(meal: MealType) {
        setMeals(m => ({ ...m, [meal]: !m[meal] }));
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <input 
                className="input" 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
            />
            {(["BREAKFAST", "LUNCH", "DINNER"] as MealType[]).map(m => (
                <FancyCheckbox 
                    key={m} 
                    label={m} 
                    checked={meals[m]} 
                    onChange={() => toggle(m)} 
                />
            ))}
            <button
                className="btn btn-secondary"
                onClick={() =>
                    onAdd(
                        date,
                        (Object.keys(meals) as MealType[]).filter(k => meals[k])
                    )
                }
            >
                Add day
            </button>
        </div>
    );
}