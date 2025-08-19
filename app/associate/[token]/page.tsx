"use client";

import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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
    const token = (params?.token as string) || "";

    const [trip, setTrip] = useState<Trip | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string>("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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

                // If no unassociated participants, redirect to trip
                if (participantsData.participants.length === 0) {
                    setError("No available participants to associate with. All participants are already linked to user accounts.");
                    return;
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
                    onClick={() => router.push("/join/" + token)}
                >
                    Create a new participant instead
                </button>
            </div>
        </div>
    );
}