"use client";

import { useState, useEffect } from "react";
import { X, Download, Calendar, Clock, MapPin, Users, ChefHat } from "lucide-react";
import { formatHumanDate } from "@/lib/dates";
import { useLocale } from "next-intl";

interface MealSlot {
    id: string;
    date: string;
    mealType: string;
    startTime?: string;
    assignments: Array<{
        role: string;
        participant: { name: string; email?: string; dietaryRestrictions?: string };
    }>;
    recipes: Array<{
        recipe: { title: string };
    }>;
}

interface Trip {
    id: string;
    name: string;
    location?: string;
    timezone?: string;
    defaultBreakfastTime?: string;
    defaultLunchTime?: string;
    defaultDinnerTime?: string;
}

interface CalendarPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: Trip;
    tripId: string;
}

const MEAL_TRANSLATIONS = {
    en: {
        BREAKFAST: 'Breakfast',
        LUNCH: 'Lunch',
        DINNER: 'Dinner'
    },
    fr: {
        BREAKFAST: 'Petit-déjeuner',
        LUNCH: 'Déjeuner',
        DINNER: 'Dîner'
    }
} as const;

export default function CalendarPreviewModal({ isOpen, onClose, trip, tripId }: CalendarPreviewModalProps) {
    const locale = useLocale() as 'en' | 'fr';
    const [slots, setSlots] = useState<MealSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [calendarUrl, setCalendarUrl] = useState("");

    useEffect(() => {
        if (isOpen) {
            setCalendarUrl(`${window.location.origin}/api/trips/${tripId}/schedule/ics`);
            fetchSlots();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, tripId]);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/trips/${tripId}/schedule`);
            if (response.ok) {
                const data = await response.json();
                setSlots(data.slots || []);
            }
        } catch (error) {
            console.error("Failed to fetch slots:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        window.open(calendarUrl, '_blank');
    };

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(calendarUrl);
            // You might want to show a toast here
        } catch (error) {
            console.error("Failed to copy URL:", error);
        }
    };

    const translateMealType = (mealType: string): string => {
        return MEAL_TRANSLATIONS[locale]?.[mealType as keyof typeof MEAL_TRANSLATIONS.en] || mealType;
    };

    const getDefaultTime = (mealType: string): string => {
        const timeMap = {
            BREAKFAST: trip.defaultBreakfastTime || "08:00",
            LUNCH: trip.defaultLunchTime || "12:00", 
            DINNER: trip.defaultDinnerTime || "19:00"
        };
        return timeMap[mealType as keyof typeof timeMap] || "12:00";
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-6 h-6" />
                                Calendar Preview
                            </h2>
                            <p className="text-gray-600 mt-1">Preview events before downloading</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                            <h3 className="font-semibold text-lg text-gray-900">{trip.name}</h3>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                {trip.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{trip.location}</span>
                                    </div>
                                )}
                                {trip.timezone && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{trip.timezone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{slots.length} events</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">Events ({slots.length})</h4>
                        <div className="max-h-80 overflow-y-auto space-y-3">
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Loading events...</div>
                            ) : slots.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No events scheduled yet</div>
                            ) : (
                                slots.map((slot) => {
                                    const cooks = slot.assignments.filter(a => a.role === "COOK").map(a => a.participant.name);
                                    const helpers = slot.assignments.filter(a => a.role === "HELPER").map(a => a.participant.name);
                                    const recipes = slot.recipes.map(r => r.recipe.title);
                                    const startTime = slot.startTime || getDefaultTime(slot.mealType);
                                    
                                    return (
                                        <div key={slot.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <ChefHat className="w-4 h-4 text-purple-600" />
                                                        <span className="font-medium text-gray-900">
                                                            {translateMealType(slot.mealType)}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {formatHumanDate(slot.date, locale)} at {startTime}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="space-y-1 text-sm">
                                                        {cooks.length > 0 ? (
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-3 h-3 text-green-600" />
                                                                <span className="text-gray-600">Cooks: {cooks.join(", ")}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-3 h-3 text-gray-400" />
                                                                <span className="text-gray-400">Cooks: TBD</span>
                                                            </div>
                                                        )}
                                                        
                                                        {helpers.length > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-3 h-3 text-blue-600" />
                                                                <span className="text-gray-600">Helpers: {helpers.join(", ")}</span>
                                                            </div>
                                                        )}
                                                        
                                                        {recipes.length > 0 ? (
                                                            <div className="text-gray-600">Recipes: {recipes.join(", ")}</div>
                                                        ) : (
                                                            <div className="text-gray-400">Recipes: TBD</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleDownload}
                            className="btn btn-primary flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download Calendar
                        </button>
                        <button
                            onClick={handleCopyUrl}
                            className="btn btn-secondary flex items-center justify-center gap-2"
                        >
                            <Calendar className="w-4 h-4" />
                            Copy Calendar URL
                        </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-3">
                        Calendar URL can be subscribed to for automatic updates in your calendar app
                    </p>
                </div>
            </div>
        </div>
    );
}