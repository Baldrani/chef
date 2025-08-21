"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { formatHumanDate } from "@/lib/dates";
import FancyCheckbox from "@/app/components/FancyCheckbox";
import Loader from "@/app/components/Loader";
import {
    Link as LinkIcon,
    Check as CheckIcon,
    ArrowLeft,
    Settings,
    Zap,
    Download,
} from "lucide-react";
import { toast } from "sonner";

type Trip = { id: string; name: string; startDate: string; endDate: string };

interface TripHeaderProps {
    trip: Trip | null;
    invite: { id: string; token: string } | null;
    tripId: string;
    onScheduleRefresh: () => Promise<void>;
    onRecipeRefresh: () => Promise<void>;
}

export function TripHeader({ trip, invite, tripId, onScheduleRefresh, onRecipeRefresh }: TripHeaderProps) {
    const locale = useLocale();
    const [cooksPerMeal, setCooksPerMeal] = useState<number>(2);
    const [helpersPerMeal, setHelpersPerMeal] = useState<number>(0);
    const [avoidConsecutive, setAvoidConsecutive] = useState<boolean>(true);
    const [prioritizeEqualParticipation, setPriorizeEqualParticipation] = useState<boolean>(false);
    const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

    async function genSchedule() {
        setIsGeneratingSchedule(true);
        try {
            await fetch(`/api/schedule/generate`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    tripId,
                    maxCooksPerMeal: cooksPerMeal,
                    maxHelpersPerMeal: helpersPerMeal,
                    avoidConsecutive,
                    autoAssignRecipes: false,
                    recipesPerMeal: 1,
                    prioritizeEqualParticipation,
                }),
            });
            await onScheduleRefresh();
            await onRecipeRefresh();
        } finally {
            setIsGeneratingSchedule(false);
        }
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Link href="/trips" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 transition-colors font-medium">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Trips
                        </Link>
                        <span className="text-slate-300">|</span>
                        <Link href={`/trips/${tripId}/admin`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 transition-colors font-medium">
                            <Settings className="w-4 h-4" />
                            Trip Admin
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-bold animate-gradient">{trip?.name ?? "Trip"}</h1>
                        {invite && <CopyInviteButton token={invite.token} />}
                    </div>
                    <div className="text-lg text-slate-600 font-medium">
                        {trip ? `${formatHumanDate(trip.startDate, locale)} → ${formatHumanDate(trip.endDate, locale)}` : ""}
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600 font-medium">Cooks</label>
                            <input
                                className="input w-16"
                                type="number"
                                min={1}
                                max={6}
                                value={cooksPerMeal}
                                onChange={e => setCooksPerMeal(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600 font-medium">Helpers</label>
                            <input
                                className="input w-16"
                                type="number"
                                min={0}
                                max={6}
                                value={helpersPerMeal}
                                onChange={e => setHelpersPerMeal(Math.max(0, Math.min(6, Number(e.target.value) || 0)))}
                            />
                        </div>
                        <FancyCheckbox label="Avoid consecutive" checked={avoidConsecutive} onChange={setAvoidConsecutive} />
                        <FancyCheckbox 
                            label="Equal participation" 
                            checked={prioritizeEqualParticipation} 
                            onChange={setPriorizeEqualParticipation}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button className="btn btn-primary" onClick={genSchedule} disabled={isGeneratingSchedule}>
                            {isGeneratingSchedule ? (
                                <div className="flex items-center gap-2">
                                    <Loader size="sm" />
                                    Generating...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5" />
                                    Generate Schedule
                                </div>
                            )}
                        </button>
                        <a className="btn btn-secondary" href={`/api/trips/${tripId}/schedule/ics`} target="_blank" rel="noreferrer">
                            <div className="flex items-center gap-2">
                                <Download className="w-5 h-5" />
                                Export ICS
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CopyInviteButton({ token }: { token: string }) {
    const [copied, setCopied] = useState(false);
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${token}`;

    async function onCopy() {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Invite link copied");
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error("Failed to copy link");
        }
    }

    return (
        <button
            type="button"
            onClick={onCopy}
            className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-110 ${
                copied
                    ? "bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg shadow-green-500/25"
                    : "bg-white/60 backdrop-blur-sm border border-white/50 text-slate-600 hover:text-purple-600 hover:bg-white/80 shadow-md hover:shadow-lg"
            }`}
            title={copied ? "Copied" : "Copy invite link"}
            aria-label="Copy invite link"
        >
            {copied ? <CheckIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
        </button>
    );
}