"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { AvailabilityPicker } from "./AvailabilityPicker";
import FancyCheckbox from "@/app/components/FancyCheckbox";
import Loader from "@/app/components/Loader";
import {
    Users as UsersIcon,
    User,
    ChevronDown,
    Heart,
    Calendar,
    Pencil,
    Trash,
} from "lucide-react";

type Trip = { id: string; name: string; startDate: string; endDate: string };

type ParticipantRow = {
    id: string;
    name: string;
    cookingPreference: number;
    availabilities: { date: string }[];
};

interface TeamTabProps {
    trip: Trip | null;
    tripId: string;
    participants: ParticipantRow[];
    onParticipantsRefresh: () => Promise<void>;
    onScheduleRefresh: () => Promise<void>;
}

export function TeamTab({ trip, tripId, participants, onParticipantsRefresh, onScheduleRefresh }: TeamTabProps) {
    const [participantsName, setParticipantsName] = useState("");
    const [preference, setPreference] = useState<number>(0);
    const [availabilityInput, setAvailabilityInput] = useState("");
    const [isAddingParticipant, setIsAddingParticipant] = useState(false);

    async function addParticipant() {
        const availability = availabilityInput
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
        setIsAddingParticipant(true);
        try {
            await fetch(`/api/participants`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ tripId, name: participantsName, cookingPreference: preference, availability }),
            });
            setParticipantsName("");
            setPreference(0);
            setAvailabilityInput("");
            await onParticipantsRefresh();
        } finally {
            setIsAddingParticipant(false);
        }
    }

    return (
        <section className="card space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Participants</h2>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative">
                    <input 
                        className="input w-full pl-8!" 
                        placeholder="Participant name" 
                        value={participantsName} 
                        onChange={e => setParticipantsName(e.target.value)} 
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
                <div className="relative">
                    <select 
                        className="input w-full appearance-none pr-10" 
                        value={preference} 
                        onChange={e => setPreference(parseInt(e.target.value))}
                    >
                        <option value={2}>🔥 Loves cooking</option>
                        <option value={1}>😊 Enjoys cooking</option>
                        <option value={0}>😐 Neutral</option>
                        <option value={-1}>😕 Prefers not to</option>
                        <option value={-2}>😤 Hates cooking</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </div>

            {trip && (
                <AvailabilityPicker 
                    startDate={trip.startDate} 
                    endDate={trip.endDate} 
                    onChange={dates => setAvailabilityInput(dates.join(","))} 
                />
            )}

            <button 
                className="btn btn-primary" 
                onClick={addParticipant} 
                disabled={isAddingParticipant || !participantsName}
            >
                {isAddingParticipant ? (
                    <div className="flex items-center gap-2">
                        <Loader size="sm" />
                        Adding...
                    </div>
                ) : (
                    "Add"
                )}
            </button>

            <ul className="divide-y divide-slate-100">
                {participants.map(p => (
                    <li key={p.id} className="py-4 flex items-center justify-between hover:bg-slate-50/50 rounded-lg px-4 -mx-4 transition-colors">
                        <div className="min-w-0 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">{p.name}</div>
                                <div className="text-sm text-slate-600 flex items-center gap-2">
                                    <span className="flex items-center gap-1">
                                        <Heart className="w-3 h-3" />
                                        Pref: {p.cookingPreference}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {p.availabilities.length > 0 ? `${p.availabilities.length} days available` : "No availability set"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="shrink-0 flex gap-2">
                            <Link 
                                href={`/participants/${p.id}`} 
                                className="btn btn-secondary"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit
                            </Link>
                            <button
                                className="btn btn-secondary hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                                onClick={async () => {
                                    if (!confirm(`Remove ${p.name} from trip?`)) return;
                                    await fetch(`/api/participants/${p.id}`, { method: "DELETE" });
                                    await onParticipantsRefresh();
                                    await onScheduleRefresh();
                                }}
                            >
                                <Trash className="w-4 h-4" />
                                Remove
                            </button>
                        </div>
                    </li>
                ))}
                {participants.length === 0 && (
                    <li className="py-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                <UsersIcon className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-700">No participants yet</div>
                                <div className="text-xs text-slate-500">Add participants using the form above</div>
                            </div>
                        </div>
                    </li>
                )}
            </ul>
        </section>
    );
}