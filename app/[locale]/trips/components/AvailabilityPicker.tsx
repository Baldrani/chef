"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { enumerateUtcYmdInclusive, formatHumanYmd } from "@/lib/dates";
import FancyCheckbox from "@/app/components/FancyCheckbox";

interface AvailabilityPickerProps {
    startDate: string;
    endDate: string;
    onChange: (dates: string[]) => void;
}

export function AvailabilityPicker({ startDate, endDate, onChange }: AvailabilityPickerProps) {
    const locale = useLocale();
    const [selected, setSelected] = useState<Record<string, boolean>>({});

    const allDates = useMemo(() => enumerateUtcYmdInclusive(startDate, endDate), [startDate, endDate]);

    useEffect(() => {
        onChange(
            Object.entries(selected)
                .filter(([, v]) => v)
                .map(([k]) => k)
        );
    }, [selected, onChange]);

    function toggle(date: string) {
        setSelected(s => ({ ...s, [date]: !s[date] }));
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Availability</div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setSelected(Object.fromEntries(allDates.map(d => [d, true]))) }
                    >
                        Select all days
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setSelected({})}
                    >
                        Clear
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {allDates.map(d => (
                    <div key={d} className="flex items-center gap-2 border rounded px-2 py-2 bg-white/70">
                        <FancyCheckbox 
                            label={formatHumanYmd(d, locale)} 
                            checked={!!selected[d]} 
                            onChange={() => toggle(d)} 
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}