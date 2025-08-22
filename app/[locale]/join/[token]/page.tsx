"use client";

import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { enumerateUtcYmdInclusive, formatHumanYmd } from "@/lib/dates";
import Loader from "@/app/components/Loader";
import { useInviteInfo, useCreateParticipant } from "@/lib/queries";

export default function JoinPage() {
    const params = useParams<{ token: string }>();
    const router = useRouter();
    const locale = useLocale();
    const token = (params?.token as string) || "";

    const { data: inviteInfo, isLoading: isInviteLoading, error: inviteError } = useInviteInfo(token);
    const createParticipantMutation = useCreateParticipant();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [cookingPreference, setCookingPreference] = useState(0);
    const [availabilityDates, setAvailabilityDates] = useState<Record<string, boolean>>({});

    const allDates: string[] = useMemo(() => {
        if (!inviteInfo?.trip) return [];
        return enumerateUtcYmdInclusive(inviteInfo.trip.startDate, inviteInfo.trip.endDate);
    }, [inviteInfo]);


    const toggleAvailabilityDate = (date: string) => {
        setAvailabilityDates(prev => ({ ...prev, [date]: !prev[date] }));
    };

    const handleSubmit = () => {
        if (!name.trim()) return;

        const availability = Object.entries(availabilityDates)
            .filter(([, isAvailable]) => isAvailable)
            .map(([date]) => date);

        createParticipantMutation.mutate(
            {
                token,
                data: {
                    name: name.trim(),
                    email: email.trim() || undefined,
                    cookingPreference,
                    availability
                }
            },
            {
                onSuccess: (participant) => {
                    router.push(`/trips/${participant.tripId}`);
                }
            }
        );
    };

    if (isInviteLoading) {
        return (
            <div className="max-w-md mx-auto p-6">
                <Loader size="lg" text="Loading invitation..." className="py-20" />
            </div>
        );
    }

    if (inviteError || !inviteInfo) {
        return (
            <div className="max-w-md mx-auto p-6">
                <div className="text-red-600 text-sm mb-4">Invalid or expired invitation</div>
                <button 
                    className="bg-black text-white rounded px-4 py-2"
                    onClick={() => router.push("/")}
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Join {inviteInfo.trip.name}</h1>
                <p className="text-gray-600 text-sm mt-2">
                    {formatHumanYmd(inviteInfo.trip.startDate, locale)} - {formatHumanYmd(inviteInfo.trip.endDate, locale)}
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input 
                        className="border rounded px-3 py-2 w-full" 
                        placeholder="Your name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Email (optional)</label>
                    <input 
                        className="border rounded px-3 py-2 w-full" 
                        type="email"
                        placeholder="Your email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Cooking preference</label>
                    <select 
                        className="border rounded px-3 py-2 w-full" 
                        value={cookingPreference} 
                        onChange={e => setCookingPreference(parseInt(e.target.value))}
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
                        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                            {allDates.map(date => (
                                <label key={date} className="flex items-center gap-3 border rounded px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                                    <input 
                                        type="checkbox" 
                                        checked={!!availabilityDates[date]} 
                                        onChange={() => toggleAvailabilityDate(date)} 
                                        className="rounded"
                                    />
                                    <span>{formatHumanYmd(date, locale)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {createParticipantMutation.error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                        {createParticipantMutation.error.message || "Failed to join trip"}
                    </div>
                )}

                <button 
                    className="w-full bg-black text-white rounded px-4 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={createParticipantMutation.isPending || !name.trim()}
                >
                    {createParticipantMutation.isPending ? "Joining..." : "Join Trip"}
                </button>
            </div>
        </div>
    );
}
