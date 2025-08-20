"use client";

import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { enumerateUtcYmdInclusive, formatHumanYmd } from "@/lib/dates";
import Loader from "@/app/components/Loader";

interface Participant {
    id: string;
    name: string;
    email?: string;
    cookingPreference: number;
}

interface Trip {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
}

export default function AssociatePage() {
    const params = useParams<{ token: string }>();
    const router = useRouter();
    const { data: session, status } = useSession();
    const locale = useLocale();
    const token = (params?.token as string) || "";

    const [trip, setTrip] = useState<Trip | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string>("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // New participant modal state
    const [showNewParticipantModal, setShowNewParticipantModal] = useState(false);
    const [newParticipantName, setNewParticipantName] = useState("");
    const [newParticipantEmail, setNewParticipantEmail] = useState("");
    const [newParticipantPref, setNewParticipantPref] = useState(0);
    const [newParticipantDates, setNewParticipantDates] = useState<Record<string, boolean>>({});
    const [creatingParticipant, setCreatingParticipant] = useState(false);

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/associate/${token}`)}`);
            return;
        }
    }, [session, status, router, token]);

    useEffect(() => {
        if (!token || !session) return;

        (async () => {
            try {
                // Get invite info and unassociated participants
                const [inviteRes, participantsRes] = await Promise.all([
                    fetch(`/api/invites/${token}`, { cache: "no-store" }),
                    fetch(`/api/invites/${token}/participants`, { cache: "no-store" })
                ]);

                if (!inviteRes.ok || !participantsRes.ok) {
                    setError("Invalid or expired invitation");
                    return;
                }

                const inviteData = await inviteRes.json();
                const participantsData = await participantsRes.json();

                setTrip(inviteData.trip);
                setParticipants(participantsData.participants);

                // If no unassociated participants, show option to create new participant
                if (participantsData.participants.length === 0) {
                    setShowNewParticipantModal(true);
                }
            } catch (err) {
                setError("Failed to load invitation");
            } finally {
                setIsLoading(false);
            }
        })();
    }, [token, session]);

    const cookingPreferenceText = (pref: number) => {
        switch (pref) {
            case 2: return "Loves cooking";
            case 1: return "Enjoys cooking";
            case 0: return "Neutral";
            case -1: return "Prefers not to cook";
            case -2: return "Hates cooking";
            default: return "Unknown";
        }
    };

    async function associate() {
        if (!selectedParticipantId) return;

        setBusy(true);
        setError(null);
        try {
            const res = await fetch(`/api/invites/${token}/associate`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ participantId: selectedParticipantId }),
            });

            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                setError(j.error || "Failed to associate");
                return;
            }

            const result = await res.json();
            router.push(`/trips/${result.tripId}`);
        } finally {
            setBusy(false);
        }
    }

    const allDates: string[] = useMemo(() => {
        if (!trip) return [];
        return enumerateUtcYmdInclusive(trip.startDate, trip.endDate);
    }, [trip]);

    const toggleNewParticipantDate = (date: string) => {
        setNewParticipantDates(prev => ({ ...prev, [date]: !prev[date] }));
    };

    const createNewParticipant = async () => {
        if (!newParticipantName.trim()) return;

        setCreatingParticipant(true);
        setError(null);
        try {
            const availability = Object.entries(newParticipantDates)
                .filter(([, v]) => v)
                .map(([k]) => k);
            
            const res = await fetch(`/api/invites/${token}/accept`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ 
                    name: newParticipantName.trim(),
                    email: newParticipantEmail.trim() || undefined,
                    cookingPreference: newParticipantPref, 
                    availability 
                }),
            });

            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                setError(j.error || "Failed to create participant");
                return;
            }

            const participant = await res.json();
            
            // Now associate the newly created participant with the user
            const associateRes = await fetch(`/api/invites/${token}/associate`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ participantId: participant.id }),
            });

            if (!associateRes.ok) {
                const j = await associateRes.json().catch(() => ({}));
                setError(j.error || "Failed to associate with new participant");
                return;
            }

            router.push(`/trips/${participant.tripId}`);
        } finally {
            setCreatingParticipant(false);
        }
    };

    if (status === "loading" || !session) {
        return (
            <div className="max-w-md mx-auto p-6">
                <Loader size="lg" text="Loading..." className="py-20" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-md mx-auto p-6">
                <Loader size="lg" text="Loading invitation..." className="py-20" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto p-6">
                <div className="text-red-600 text-sm mb-4">{error}</div>
                <button 
                    className="bg-black text-white rounded px-4 py-2"
                    onClick={() => router.push("/trips")}
                >
                    Go to My Trips
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-6 space-y-4">
            <div>
                <h1 className="text-xl font-semibold">Join {trip?.name}</h1>
                <p className="text-gray-600 text-sm mt-1">
                    Hello {session.user?.name}! Please select which participant you are:
                </p>
            </div>

            <div className="space-y-3">
                {participants.map((participant) => (
                    <label 
                        key={participant.id} 
                        className={`block border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedParticipantId === participant.id 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-gray-300 hover:border-gray-400"
                        }`}
                    >
                        <input
                            type="radio"
                            name="participant"
                            value={participant.id}
                            checked={selectedParticipantId === participant.id}
                            onChange={(e) => setSelectedParticipantId(e.target.value)}
                            className="sr-only"
                        />
                        <div className="space-y-1">
                            <div className="font-medium">{participant.name}</div>
                            {participant.email && (
                                <div className="text-sm text-gray-600">{participant.email}</div>
                            )}
                            <div className="text-sm text-gray-500">
                                {cookingPreferenceText(participant.cookingPreference)}
                            </div>
                        </div>
                    </label>
                ))}
            </div>

            <button 
                className="bg-black text-white rounded px-4 py-2 w-full disabled:opacity-50" 
                onClick={associate} 
                disabled={busy || !selectedParticipantId}
            >
                {busy ? "Associating..." : "Continue to Trip"}
            </button>

            <div className="text-center">
                <button 
                    className="text-gray-500 text-sm underline hover:text-gray-700"
                    onClick={() => setShowNewParticipantModal(true)}
                >
                    Create a new participant instead
                </button>
            </div>

            {/* New Participant Modal */}
            {showNewParticipantModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Create New Participant</h2>
                            <button 
                                onClick={() => setShowNewParticipantModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input 
                                    className="border rounded px-3 py-2 w-full" 
                                    placeholder="Your name" 
                                    value={newParticipantName} 
                                    onChange={e => setNewParticipantName(e.target.value)} 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Email (optional)</label>
                                <input 
                                    className="border rounded px-3 py-2 w-full" 
                                    type="email"
                                    placeholder="Your email" 
                                    value={newParticipantEmail} 
                                    onChange={e => setNewParticipantEmail(e.target.value)} 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Cooking preference</label>
                                <select 
                                    className="border rounded px-3 py-2 w-full" 
                                    value={newParticipantPref} 
                                    onChange={e => setNewParticipantPref(parseInt(e.target.value))}
                                >
                                    <option value={2}>Loves cooking</option>
                                    <option value={1}>Enjoys cooking</option>
                                    <option value={0}>Neutral</option>
                                    <option value={-1}>Prefers not to cook</option>
                                    <option value={-2}>Hates cooking</option>
                                </select>
                            </div>

                            {allDates.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Available days</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                        {allDates.map(d => (
                                            <label key={d} className="flex items-center gap-2 border rounded px-2 py-2 text-sm">
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!newParticipantDates[d]} 
                                                    onChange={() => toggleNewParticipantDate(d)} 
                                                />
                                                <span>{formatHumanYmd(d, locale)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && <div className="text-red-600 text-sm">{error}</div>}

                            <div className="flex gap-3 pt-4">
                                <button 
                                    className="flex-1 bg-gray-200 text-gray-800 rounded px-4 py-2 hover:bg-gray-300"
                                    onClick={() => setShowNewParticipantModal(false)}
                                    disabled={creatingParticipant}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="flex-1 bg-black text-white rounded px-4 py-2 disabled:opacity-50"
                                    onClick={createNewParticipant}
                                    disabled={creatingParticipant || !newParticipantName.trim()}
                                >
                                    {creatingParticipant ? "Creating..." : "Create & Join"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}