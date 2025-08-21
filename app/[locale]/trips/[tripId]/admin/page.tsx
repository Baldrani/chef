"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { formatHumanDate, formatISODate } from "@/lib/dates";
import Loader from "@/app/components/Loader";
import { 
  useTrip, 
  useParticipants, 
  useMealSlots, 
  useUpdateTrip,
  useDisassociateParticipant,
  useAssignParticipantToMeal,
  useRemoveParticipantFromMeal,
  useDeleteMeal
} from "@/lib/queries";
import { ArrowLeftIcon, CheckIcon, XIcon, EditIcon, UsersIcon, UtensilsIcon, Trash2Icon, ChevronDownIcon, ChevronUpIcon, ClockIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

export default function TripAdminPage() {
    const params = useParams<{ tripId: string }>();
    const tripId = params?.tripId as string;
    const locale = useLocale();

    // UI state (only what's actually UI-related)
    const [isEditingTrip, setIsEditingTrip] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        startDate: "",
        endDate: ""
    });
    const [collapsedMeals, setCollapsedMeals] = useState<Set<string>>(new Set());
    const [mealTimesForm, setMealTimesForm] = useState({
        defaultBreakfastTime: "08:00",
        defaultLunchTime: "12:00",
        defaultDinnerTime: "19:00"
    });
    const [savingMealTimes, setSavingMealTimes] = useState(false);

    // TanStack Query hooks - replace all manual data fetching
    const { data: trip, isLoading: isTripLoading, error: tripError } = useTrip(tripId);
    const { data: participants = [], isLoading: isParticipantsLoading } = useParticipants(tripId);
    const { data: mealSlots = [], isLoading: isMealSlotsLoading } = useMealSlots(tripId);
    
    // Mutation hooks - replace all manual mutation handling
    const updateTripMutation = useUpdateTrip();
    const disassociateParticipantMutation = useDisassociateParticipant();
    const assignParticipantMutation = useAssignParticipantToMeal();
    const removeParticipantMutation = useRemoveParticipantFromMeal();
    const deleteMealMutation = useDeleteMeal();

    // Initialize edit form when trip data loads
    useEffect(() => {
        if (trip) {
            setEditForm({
                name: trip.name,
                startDate: formatISODate(new Date(trip.startDate)),
                endDate: formatISODate(new Date(trip.endDate))
            });
            setMealTimesForm({
                defaultBreakfastTime: trip.defaultBreakfastTime || "08:00",
                defaultLunchTime: trip.defaultLunchTime || "12:00",
                defaultDinnerTime: trip.defaultDinnerTime || "19:00"
            });
        }
    }, [trip]);

    // Initialize all meals as collapsed when meal slots load
    useEffect(() => {
        if (mealSlots.length > 0) {
            const allMealIds = new Set(mealSlots.map(slot => slot.id));
            setCollapsedMeals(allMealIds);
        }
    }, [mealSlots]);

    // Trip editing functions
    const startEditingTrip = () => {
        setIsEditingTrip(true);
    };

    const toggleMealCollapse = (mealId: string) => {
        setCollapsedMeals(prev => {
            const newSet = new Set(prev);
            if (newSet.has(mealId)) {
                newSet.delete(mealId);
            } else {
                newSet.add(mealId);
            }
            return newSet;
        });
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

        updateTripMutation.mutate({
            tripId,
            data: {
                name: editForm.name.trim(),
                startDate: new Date(editForm.startDate).toISOString(),
                endDate: new Date(editForm.endDate).toISOString()
            }
        }, {
            onSuccess: () => {
                setIsEditingTrip(false);
            }
        });
    };

    // Mutation functions - now using TanStack Query
    const assignParticipant = (mealSlotId: string, participantId: string, role: "COOK" | "HELPER") => {
        assignParticipantMutation.mutate({ mealSlotId, participantId, role });
    };

    const removeAssignment = (mealSlotId: string, participantId: string) => {
        removeParticipantMutation.mutate({ mealSlotId, participantId });
    };

    const removeMeal = (mealSlotId: string, mealType: MealType, date: string) => {
        const mealTypeText = mealType.toLowerCase();
        const dateText = formatHumanDate(date, locale);
        
        if (!confirm(`Are you sure you want to remove the ${mealTypeText} on ${dateText}? This will permanently delete all assignments and recipes for this meal.`)) {
            return;
        }

        deleteMealMutation.mutate(mealSlotId);
    };

    const disassociateParticipant = (participantId: string, participantName: string, userName: string) => {
        if (!confirm(`Are you sure you want to disassociate ${userName} from participant "${participantName}"? This will remove the user association but keep the participant.`)) {
            return;
        }

        disassociateParticipantMutation.mutate(participantId);
    };

    const saveMealTimes = async () => {
        if (!trip) return;
        setSavingMealTimes(true);
        try {
            const response = await fetch(`/api/trips/${trip.id}/meal-times`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mealTimesForm)
            });

            if (response.ok) {
                const updatedTrip = await response.json();
                // Update the trip data (you might want to refetch or update local state)
                toast.success("Meal times updated successfully");
            } else {
                toast.error("Failed to update meal times");
            }
        } catch (error) {
            console.error("Failed to save meal times:", error);
            toast.error("Failed to update meal times");
        } finally {
            setSavingMealTimes(false);
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

    if (isTripLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader text="Loading trip..." />
            </div>
        );
    }

    if (tripError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Failed to load trip</p>
                    <Link href="/trips" className="btn btn-primary">
                        Back to Trips
                    </Link>
                </div>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Trip not found</p>
                    <Link href="/trips" className="btn btn-primary">
                        Back to Trips
                    </Link>
                </div>
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
                                    disabled={updateTripMutation.isPending || !editForm.name.trim()}
                                    className="btn btn-primary"
                                >
                                    {updateTripMutation.isPending ? (
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
                                    disabled={updateTripMutation.isPending}
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

                {/* Default Meal Times Configuration */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5" />
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
                                    value={mealTimesForm.defaultBreakfastTime}
                                    onChange={(e) => setMealTimesForm(prev => ({ ...prev, defaultBreakfastTime: e.target.value }))}
                                    className="input w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    ☀️ Lunch Time
                                </label>
                                <input
                                    type="time"
                                    value={mealTimesForm.defaultLunchTime}
                                    onChange={(e) => setMealTimesForm(prev => ({ ...prev, defaultLunchTime: e.target.value }))}
                                    className="input w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    🌙 Dinner Time
                                </label>
                                <input
                                    type="time"
                                    value={mealTimesForm.defaultDinnerTime}
                                    onChange={(e) => setMealTimesForm(prev => ({ ...prev, defaultDinnerTime: e.target.value }))}
                                    className="input w-full"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={saveMealTimes}
                                disabled={savingMealTimes}
                                className="btn btn-primary"
                            >
                                {savingMealTimes ? (
                                    <div className="flex items-center gap-2">
                                        <Loader size="sm" />
                                        Saving...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <SaveIcon className="w-4 h-4" />
                                        Save Settings
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Meal Assignments Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">Meal Assignments</h2>
                    
                    {isMealSlotsLoading ? (
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
                            {mealSlots.map((slot) => {
                                const isCollapsed = collapsedMeals.has(slot.id);
                                return (
                                <div key={slot.id} className="border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <button
                                            onClick={() => toggleMealCollapse(slot.id)}
                                            className="flex items-center gap-2 text-lg font-semibold text-slate-800 hover:text-purple-600 transition-colors"
                                        >
                                            <span className="text-2xl">{getMealTypeIcon(slot.mealType)}</span>
                                            {slot.mealType} - {formatHumanDate(slot.date, locale)}
                                            {isCollapsed ? (
                                                <ChevronDownIcon className="w-5 h-5 ml-2" />
                                            ) : (
                                                <ChevronUpIcon className="w-5 h-5 ml-2" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => removeMeal(slot.id, slot.mealType, slot.date)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Remove this meal"
                                        >
                                            <Trash2Icon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Current Assignments */}
                                    {!isCollapsed && (
                                    <>
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
                                    </>
                                    )}
                                </div>
                            )})}
                        </div>
                    )}
                </div>

                {/* Participant Management Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <UsersIcon className="w-6 h-6" />
                        Participant Management
                    </h2>
                    
                    {participants.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No participants yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {participants.map((participant) => (
                                <div key={participant.id} className="border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-800">
                                                    {participant.name}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    participant.cookingPreference >= 1 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : participant.cookingPreference === 0
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {participant.cookingPreference === 2 ? 'Loves cooking' :
                                                     participant.cookingPreference === 1 ? 'Enjoys cooking' :
                                                     participant.cookingPreference === 0 ? 'Neutral' :
                                                     participant.cookingPreference === -1 ? 'Prefers not to cook' :
                                                     'Hates cooking'}
                                                </span>
                                            </div>
                                            {participant.user ? (
                                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        <span>Associated with: <strong>{participant.user.name}</strong></span>
                                                    </div>
                                                    {participant.user.email && (
                                                        <span className="text-slate-500">({participant.user.email})</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                    <span>Not associated with any user</span>
                                                </div>
                                            )}
                                        </div>
                                        {participant.user && (
                                            <button
                                                onClick={() => disassociateParticipant(
                                                    participant.id, 
                                                    participant.name, 
                                                    participant.user!.name
                                                )}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors ml-4"
                                                title="Disassociate user from this participant"
                                            >
                                                <XIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ICS Calendar Export */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl space-y-6">
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