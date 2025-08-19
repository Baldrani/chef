"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatHumanDate, formatHumanYmd } from "@/lib/dates";
import { startOfDay, format } from "date-fns";
import Loader from "@/app/components/Loader";
import { toast } from "sonner";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

type MealSlot = { id: string; date: string; mealType: MealType; assignments?: { participant: { id: string } }[] };

type Participant = {
    id: string;
    tripId: string;
    name: string;
    email?: string | null;
    cookingPreference: number;
    dietaryRestrictions?: string | null;
    availabilities: { date: string }[];
};

type Trip = {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
};

export default function ParticipantSchedulePage() {
    const params = useParams<{ participantId: string }>();
    const participantId = params?.participantId as string;
    const locale = useLocale();
    const t = useTranslations('ParticipantPage');

    const [participant, setParticipant] = useState<Participant | null>(null);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [slots, setSlots] = useState<MealSlot[]>([]);
    const [busy, setBusy] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editCookingPreference, setEditCookingPreference] = useState(0);
    const [editDietaryRestrictions, setEditDietaryRestrictions] = useState("");
    const [editAvailabilityDates, setEditAvailabilityDates] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Get the back URL with preserved tab state
    const getBackUrl = () => {
        if (!participant?.tripId) return `/trips`;
        
        if (typeof window !== 'undefined') {
            const savedTab = sessionStorage.getItem(`trip-${participant.tripId}-tab`);
            const validTabs = ['plan', 'recipes', 'team', 'groceries'];
            
            if (savedTab && validTabs.includes(savedTab) && savedTab !== 'plan') {
                // Return with tab parameter for non-default tabs
                return `/trips/${participant.tripId}?tab=${savedTab}`;
            }
        }
        
        return `/trips/${participant.tripId}`;
    };

    async function refresh() {
        if (!participantId) return;
        setIsLoading(true);
        try {
            const p = await fetch(`/api/participants/${participantId}`, { cache: "no-store" }).then(r => r.json());
            setParticipant(p);
            
            // Initialize edit form with current data
            if (p) {
                setEditName(p.name || "");
                setEditEmail(p.email || "");
                setEditCookingPreference(p.cookingPreference || 0);
                setEditDietaryRestrictions(p.dietaryRestrictions || "");
                setEditAvailabilityDates(p.availabilities?.map((a: { date: string }) => format(startOfDay(new Date(a.date)), 'yyyy-MM-dd')) || []);
            }
            
            if (p?.tripId) {
                const [scheduleResponse, tripResponse] = await Promise.all([
                    fetch(`/api/trips/${p.tripId}/schedule`, { cache: "no-store" }),
                    fetch(`/api/trips/${p.tripId}`, { cache: "no-store" })
                ]);
                
                const s = await scheduleResponse.json();
                const t = await tripResponse.json();
                
                setSlots(s);
                setTrip(t);
            }
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [participantId]);

    async function saveChanges() {
        if (!participant) return;
        
        setIsSaving(true);
        try {
            const response = await fetch(`/api/participants/${participantId}`, {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim() || undefined,
                    email: editEmail.trim() || null,
                    cookingPreference: editCookingPreference,
                    dietaryRestrictions: editDietaryRestrictions.trim() || null,
                    availabilityDates: editAvailabilityDates,
                }),
            });

            if (response.ok) {
                toast.success("Profile updated successfully!");
                setIsEditing(false);
                await refresh();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to update profile");
            }
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    }

    function cancelEdit() {
        if (!participant) return;
        
        // Reset form to current participant data
        setEditName(participant.name || "");
        setEditEmail(participant.email || "");
        setEditCookingPreference(participant.cookingPreference || 0);
        setEditDietaryRestrictions(participant.dietaryRestrictions || "");
        setEditAvailabilityDates(participant.availabilities?.map(a => format(startOfDay(new Date(a.date)), 'yyyy-MM-dd')) || []);
        setIsEditing(false);
    }

    // Generate all dates in trip range for availability selection
    const tripDates = useMemo(() => {
        if (!trip) return [];
        
        const dates = [];
        const start = startOfDay(new Date(trip.startDate));
        const end = startOfDay(new Date(trip.endDate));
        
        let current = start;
        while (current <= end) {
            dates.push(format(current, 'yyyy-MM-dd'));
            current = new Date(current.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
        }
        
        return dates;
    }, [trip]);

    function toggleAvailabilityDate(date: string) {
        setEditAvailabilityDates(prev => {
            if (prev.includes(date)) {
                return prev.filter(d => d !== date);
            } else {
                return [...prev, date].sort();
            }
        });
    }

    function getCookingPreferenceText(pref: number) {
        switch (pref) {
            case -2: return "Really dislikes cooking";
            case -1: return "Dislikes cooking";
            case 0: return "Neutral about cooking";
            case 1: return "Likes cooking";
            case 2: return "Loves cooking";
            default: return "Neutral";
        }
    }

    const slotByDate = useMemo(() => {
        const map = new Map<string, MealSlot[]>();
        for (const s of slots) {
            const key = formatHumanYmd(s.date);
            const arr = map.get(key) ?? [];
            arr.push(s);
            map.set(key, arr);
        }
        return map;
    }, [slots]);

    if (isLoading) {
        return (
            <div className="p-4">
                <Loader size="lg" text={t('loading')} className="py-20" />
            </div>
        );
    }

    if (!participant) {
        return <div className="p-4 text-center text-slate-500">{t('notFound')}</div>;
    }

    async function setAssignment(mealSlotId: string, role: "COOK" | "HELPER" | null) {
        setBusy(true);
        try {
            if (role === null) {
                await fetch(`/api/meals/${mealSlotId}/participants/${encodeURIComponent(participantId)}`, { method: "DELETE" });
            } else {
                await fetch(`/api/meals/${mealSlotId}/participants/${encodeURIComponent(participantId)}`, {
                    method: "PUT",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ role }),
                });
            }
            await refresh();
        } finally {
            setBusy(false);
        }
    }

    function roleInSlot(s: MealSlot): "COOK" | "HELPER" | null {
        return s.assignments?.some(a => a.participant.id === participantId) ? "COOK" : null; // only shows presence; page doesn’t include role detail in schedule list
    }

    return (
        <div className="p-4 space-y-4">
            <div>
                <Link href={getBackUrl()} className="underline">
                    {t('backToTrip')}
                </Link>
            </div>
            <div className="card space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Profile Information</h2>
                    {!isEditing && (
                        <button 
                            className="btn btn-secondary text-sm"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Enter name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email (optional)</label>
                            <input
                                type="email"
                                className="input w-full"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                placeholder="Enter email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Cooking Preference: {getCookingPreferenceText(editCookingPreference)}
                            </label>
                            <input
                                type="range"
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                                min="-2"
                                max="2"
                                step="1"
                                value={editCookingPreference}
                                onChange={(e) => setEditCookingPreference(parseInt(e.target.value))}
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>Really dislikes</span>
                                <span>Neutral</span>
                                <span>Loves cooking</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Dietary Restrictions (optional)</label>
                            <textarea
                                className="input w-full"
                                rows={2}
                                value={editDietaryRestrictions}
                                onChange={(e) => setEditDietaryRestrictions(e.target.value)}
                                placeholder="Any dietary restrictions or allergies..."
                            />
                        </div>

                        {trip && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Availability ({editAvailabilityDates.length} of {tripDates.length} days selected)
                                </label>
                                <div className="grid grid-cols-7 gap-2 text-sm">
                                    {tripDates.map(date => {
                                        const isSelected = editAvailabilityDates.includes(date);
                                        return (
                                            <button
                                                key={date}
                                                type="button"
                                                className={`p-2 rounded text-xs border transition-colors ${
                                                    isSelected 
                                                        ? 'bg-green-100 border-green-300 text-green-800' 
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                                onClick={() => toggleAvailabilityDate(date)}
                                            >
                                                {format(new Date(date), 'MMM d')}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <button
                                        type="button"
                                        className="text-xs text-green-600 hover:text-green-800"
                                        onClick={() => setEditAvailabilityDates([...tripDates])}
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs text-red-600 hover:text-red-800"
                                        onClick={() => setEditAvailabilityDates([])}
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button
                                className="btn btn-primary flex-1"
                                onClick={saveChanges}
                                disabled={isSaving || !editName.trim()}
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                className="btn btn-secondary flex-1"
                                onClick={cancelEdit}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{participant.name}</span>
                            {participant.email && (
                                <span className="text-sm text-slate-500">({participant.email})</span>
                            )}
                        </div>
                        <div className="text-sm text-slate-600">
                            <strong>Cooking preference:</strong> {getCookingPreferenceText(participant.cookingPreference)} ({participant.cookingPreference > 0 ? '+' : ''}{participant.cookingPreference})
                        </div>
                        <div className="text-sm text-slate-600">
                            <strong>Available:</strong> {participant.availabilities.length > 0 
                                ? participant.availabilities.map(a => formatHumanDate(a.date, locale)).join(", ")
                                : "No availability set"}
                        </div>
                        {participant.dietaryRestrictions && (
                            <div className="text-sm text-slate-600">
                                <strong>Dietary restrictions:</strong> {participant.dietaryRestrictions}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="card space-y-3">
                <h2 className="font-medium">{t('schedule')}</h2>
                {[...slotByDate.entries()].map(([date, list]) => (
                    <div key={date} className="space-y-2">
                        <div className="text-sm text-slate-600">{date}</div>
                        <ul className="grid gap-2 sm:grid-cols-3">
                            {list.map(s => {
                                const current = roleInSlot(s);
                                return (
                                    <li key={s.id} className="card">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-medium">{s.mealType}</div>
                                            <div className="flex gap-2">
                                                <button className="btn btn-secondary" disabled={busy || current === "COOK"} onClick={() => setAssignment(s.id, "COOK")}>
                                                    {t('cook')}
                                                </button>
                                                <button className="btn btn-secondary" disabled={busy || current === "HELPER"} onClick={() => setAssignment(s.id, "HELPER")}>
                                                    {t('helper')}
                                                </button>
                                                <button className="btn btn-secondary" disabled={busy || current === null} onClick={() => setAssignment(s.id, null)}>
                                                    {t('clear')}
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
                {slots.length === 0 && <div className="text-sm text-slate-500">{t('noMeals')}</div>}
            </div>
        </div>
    );
}
