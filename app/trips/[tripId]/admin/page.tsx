"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Clock, Save } from "lucide-react";
import Loader from "@/app/components/Loader";

type Trip = {
    id: string;
    name: string;
    defaultBreakfastTime?: string | null;
    defaultLunchTime?: string | null;
    defaultDinnerTime?: string | null;
};

export default function TripAdminPage() {
    const params = useParams<{ tripId: string }>();
    const tripId = params?.tripId as string;

    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        defaultBreakfastTime: "08:00",
        defaultLunchTime: "12:00",
        defaultDinnerTime: "19:00"
    });

    useEffect(() => {
        async function loadTrip() {
            if (!tripId) return;
            try {
                const response = await fetch(`/api/trips/${tripId}`);
                if (response.ok) {
                    const tripData = await response.json();
                    setTrip(tripData);
                    setFormData({
                        defaultBreakfastTime: tripData.defaultBreakfastTime || "08:00",
                        defaultLunchTime: tripData.defaultLunchTime || "12:00",
                        defaultDinnerTime: tripData.defaultDinnerTime || "19:00"
                    });
                }
            } catch (error) {
                console.error("Failed to load trip:", error);
            } finally {
                setLoading(false);
            }
        }
        loadTrip();
    }, [tripId]);

    async function saveMealTimes() {
        if (!trip) return;
        setSaving(true);
        try {
            const response = await fetch(`/api/trips/${trip.id}/meal-times`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedTrip = await response.json();
                setTrip(updatedTrip);
            }
        } catch (error) {
            console.error("Failed to save meal times:", error);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Loader size="lg" text="Loading trip settings..." className="py-20" />
            </div>
        );
    }

    if (!trip) {
        return <div className="max-w-4xl mx-auto p-6 text-center text-slate-500">Trip not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                    <Link 
                        href={`/trips/${tripId}`} 
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Trip
                    </Link>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Trip Settings</h1>
                            <div className="text-lg text-slate-600">{trip.name}</div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Default Meal Times
                        </h2>
                        <p className="text-sm text-slate-600 mb-6">
                            Set default times for each meal type. These will be used for all new meals and ICS calendar exports.
                            Individual meals can override these times.
                        </p>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    🌅 Breakfast Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.defaultBreakfastTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, defaultBreakfastTime: e.target.value }))}
                                    className="input w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    ☀️ Lunch Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.defaultLunchTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, defaultLunchTime: e.target.value }))}
                                    className="input w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    🌙 Dinner Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.defaultDinnerTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, defaultDinnerTime: e.target.value }))}
                                    className="input w-full"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={saveMealTimes}
                                disabled={saving}
                                className="btn btn-primary"
                            >
                                {saving ? (
                                    <div className="flex items-center gap-2">
                                        <Loader size="sm" />
                                        Saving...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        Save Settings
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200/50">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">ICS Calendar Export</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Export your trip schedule to calendar apps like Google Calendar, Apple Calendar, or Outlook.
                            The export includes participant emails and 1-hour reminders.
                        </p>
                        <a 
                            href={`/api/trips/${tripId}/schedule/ics`}
                            className="btn btn-secondary"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Download ICS Calendar
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}