"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { formatHumanDate, formatISODate } from "@/lib/dates";
import Loader from "@/app/components/Loader";
import { api } from "@/lib/api-client";
import { ArrowLeftIcon, CheckIcon, XIcon, EditIcon, UsersIcon, UtensilsIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

type Trip = {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
};

type Participant = {
    id: string;
    name: string;
    cookingPreference: number;
};

type MealSlot = {
    id: string;
    date: string;
    mealType: MealType;
    assignments: Array<{
        participant: Participant;
        role: "COOK" | "HELPER";
    }>;
};

export default function TripAdminPage() {
    const params = useParams<{ tripId: string }>();
    const tripId = params?.tripId as string;
    const locale = useLocale();

    // Trip basic info state
    const [trip, setTrip] = useState<Trip | null>(null);
    const [isEditingTrip, setIsEditingTrip] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        startDate: "",
        endDate: ""
    });
    const [isSavingTrip, setIsSavingTrip] = useState(false);

    // Meal assignments state
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [mealSlots, setMealSlots] = useState<MealSlot[]>([]);
    const [isLoadingMeals, setIsLoadingMeals] = useState(true);

    // Load trip data
    useEffect(() => {
        const loadTrip = async () => {
            try {
                const res = await api.get(`/api/trips/${tripId}`);
                const tripData = await res.json();
                setTrip(tripData);
                setEditForm({
                    name: tripData.name,
                    startDate: formatISODate(new Date(tripData.startDate)),
                    endDate: formatISODate(new Date(tripData.endDate))
                });
            } catch (error) {
                toast.error("Failed to load trip details");
            }
        };

        const loadParticipants = async () => {
            try {
                const res = await api.get(`/api/participants?tripId=${tripId}`);
                const data = await res.json();
                setParticipants(data);
            } catch (error) {
                toast.error("Failed to load participants");
            }
        };

        loadTrip();
        loadParticipants();
    }, [tripId]);

    // Load meal slots and assignments
    const loadMealSlots = useCallback(async () => {
        if (!trip) return;
        
        setIsLoadingMeals(true);
        try {
            const res = await api.get(`/api/trips/${tripId}/schedule`);
            const data = await res.json();
            setMealSlots(data);
        } catch (error) {
            toast.error("Failed to load meal assignments");
        } finally {
            setIsLoadingMeals(false);
        }
    }, [tripId, trip]);

    useEffect(() => {
        loadMealSlots();
    }, [loadMealSlots]);

    // Trip editing functions
    const startEditingTrip = () => {
        setIsEditingTrip(true);
    };

    const cancelEditingTrip = () => {
        if (!trip) return;
        setEditForm({
            name: trip.name,
            startDate: formatISODate(new Date(trip.startDate)),
            endDate: formatISODate(new Date(trip.endDate))
        });
        setIsEditingTrip(false);
    };

    const saveTrip = async () => {
        if (!editForm.name.trim()) {
            toast.error("Trip name is required");
            return;
        }

        if (new Date(editForm.startDate) > new Date(editForm.endDate)) {
            toast.error("Start date must be before end date");
            return;
        }

        setIsSavingTrip(true);
        try {
            const res = await api.patch(`/api/trips/${tripId}`, {
                name: editForm.name.trim(),
                startDate: new Date(editForm.startDate).toISOString(),
                endDate: new Date(editForm.endDate).toISOString()
            });

            if (res.ok) {
                const updatedTrip = await res.json();
                setTrip(updatedTrip);
                setIsEditingTrip(false);
                toast.success("Trip updated successfully");
                // Reload meals in case date changes affected them
                loadMealSlots();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Failed to update trip");
            }
        } catch (error) {
            toast.error("Failed to update trip");
        } finally {
            setIsSavingTrip(false);
        }
    };

    // Meal assignment functions
    const assignParticipant = async (mealSlotId: string, participantId: string, role: "COOK" | "HELPER") => {
        try {
            const res = await api.put(`/api/meals/${mealSlotId}/participants/${participantId}`, { role });
            if (res.ok) {
                toast.success(`Participant assigned as ${role.toLowerCase()}`);
                loadMealSlots(); // Reload to get updated assignments
            } else {
                toast.error("Failed to assign participant");
            }
        } catch (error) {
            toast.error("Failed to assign participant");
        }
    };

    const removeAssignment = async (mealSlotId: string, participantId: string) => {
        try {
            const res = await api.delete(`/api/meals/${mealSlotId}/participants/${participantId}`);
            if (res.ok) {
                toast.success("Assignment removed");
                loadMealSlots(); // Reload to get updated assignments
            } else {
                toast.error("Failed to remove assignment");
            }
        } catch (error) {
            toast.error("Failed to remove assignment");
        }
    };

    const removeMeal = async (mealSlotId: string, mealType: MealType, date: string) => {
        const mealTypeText = mealType.toLowerCase();
        const dateText = formatHumanDate(date, locale);
        
        if (!confirm(`Are you sure you want to remove the ${mealTypeText} on ${dateText}? This will permanently delete all assignments and recipes for this meal.`)) {
            return;
        }

        try {
            const res = await api.delete(`/api/meals/${mealSlotId}`);
            if (res.ok) {
                toast.success("Meal removed successfully");
                loadMealSlots(); // Reload to get updated meal slots
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Failed to remove meal");
            }
        } catch (error) {
            toast.error("Failed to remove meal");
        }
    };

    const getMealTypeIcon = (mealType: MealType) => {
        switch (mealType) {
            case "BREAKFAST":
                return "🌅";
            case "LUNCH":
                return "☀️";
            case "DINNER":
                return "🌙";
        }
    };

    if (!trip) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader text="Loading trip..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={`/trips/${tripId}`}
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 transition-colors font-medium"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Trip
                    </Link>
                </div>

                {/* Trip Basic Info Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-slate-800">Trip Administration</h1>
                        {!isEditingTrip && (
                            <button
                                onClick={startEditingTrip}
                                className="btn btn-secondary"
                            >
                                <EditIcon className="w-4 h-4" />
                                Edit Trip Details
                            </button>
                        )}
                    </div>

                    {isEditingTrip ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Trip Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="input w-full"
                                        placeholder="Enter trip name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={editForm.startDate}
                                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={editForm.endDate}
                                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={saveTrip}
                                    disabled={isSavingTrip || !editForm.name.trim()}
                                    className="btn btn-primary"
                                >
                                    {isSavingTrip ? (
                                        <>
                                            <Loader size="sm" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckIcon className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={cancelEditingTrip}
                                    disabled={isSavingTrip}
                                    className="btn btn-secondary"
                                >
                                    <XIcon className="w-4 h-4" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-slate-500 mb-1">Trip Name</h3>
                                    <p className="text-xl font-semibold text-slate-800">{trip.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-slate-500 mb-1">Start Date</h3>
                                    <p className="text-xl font-semibold text-slate-800">
                                        {formatHumanDate(trip.startDate, locale)}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-slate-500 mb-1">End Date</h3>
                                    <p className="text-xl font-semibold text-slate-800">
                                        {formatHumanDate(trip.endDate, locale)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Meal Assignments Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">Meal Assignments</h2>
                    
                    {isLoadingMeals ? (
                        <div className="py-8">
                            <Loader text="Loading meal assignments..." />
                        </div>
                    ) : mealSlots.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <UtensilsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No meals scheduled yet</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {mealSlots.map((slot) => (
                                <div key={slot.id} className="border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                            <span className="text-2xl">{getMealTypeIcon(slot.mealType)}</span>
                                            {slot.mealType} - {formatHumanDate(slot.date, locale)}
                                        </h3>
                                        <button
                                            onClick={() => removeMeal(slot.id, slot.mealType, slot.date)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Remove this meal"
                                        >
                                            <Trash2Icon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Current Assignments */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                                                <UtensilsIcon className="w-4 h-4" />
                                                Cooks ({slot.assignments.filter(a => a.role === "COOK").length})
                                            </h4>
                                            <div className="space-y-2">
                                                {slot.assignments
                                                    .filter(a => a.role === "COOK")
                                                    .map((assignment) => (
                                                    <div
                                                        key={assignment.participant.id}
                                                        className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg"
                                                    >
                                                        <span className="font-medium text-green-800">
                                                            {assignment.participant.name}
                                                        </span>
                                                        <button
                                                            onClick={() => removeAssignment(slot.id, assignment.participant.id)}
                                                            className="text-red-600 hover:text-red-800 p-1"
                                                            title="Remove assignment"
                                                        >
                                                            <XIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                                                <UsersIcon className="w-4 h-4" />
                                                Helpers ({slot.assignments.filter(a => a.role === "HELPER").length})
                                            </h4>
                                            <div className="space-y-2">
                                                {slot.assignments
                                                    .filter(a => a.role === "HELPER")
                                                    .map((assignment) => (
                                                    <div
                                                        key={assignment.participant.id}
                                                        className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg"
                                                    >
                                                        <span className="font-medium text-blue-800">
                                                            {assignment.participant.name}
                                                        </span>
                                                        <button
                                                            onClick={() => removeAssignment(slot.id, assignment.participant.id)}
                                                            className="text-red-600 hover:text-red-800 p-1"
                                                            title="Remove assignment"
                                                        >
                                                            <XIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assign Participants */}
                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-medium text-slate-600 mb-3">Assign Participants</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                            {participants
                                                .filter(p => !slot.assignments.some(a => a.participant.id === p.id))
                                                .map((participant) => (
                                                <div
                                                    key={participant.id}
                                                    className="bg-slate-50 rounded-lg p-3 space-y-2"
                                                >
                                                    <div className="font-medium text-slate-800 text-sm">
                                                        {participant.name}
                                                        <span className="ml-2 text-xs text-slate-500">
                                                            (Pref: {participant.cookingPreference > 0 ? '+' : ''}{participant.cookingPreference})
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => assignParticipant(slot.id, participant.id, "COOK")}
                                                            className="flex-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors"
                                                        >
                                                            Cook
                                                        </button>
                                                        <button
                                                            onClick={() => assignParticipant(slot.id, participant.id, "HELPER")}
                                                            className="flex-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
                                                        >
                                                            Helper
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {participants.filter(p => !slot.assignments.some(a => a.participant.id === p.id)).length === 0 && (
                                            <p className="text-sm text-slate-500 italic">All participants are already assigned to this meal</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}