"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { enumerateUtcYmdInclusive, formatISODate } from "@/lib/dates";
import Loader from "@/app/components/Loader";
import { TripHeader } from "../components/TripHeader";
import { StatGrid } from "../components/StatGrid";
import { TabNavigation } from "../components/TabNavigation";
import { PlanTab } from "../components/PlanTab";
import { TeamTab } from "../components/TeamTab";
import { RecipesTab } from "../components/RecipesTab";
import { GroceriesTab } from "../components/GroceriesTab";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

type MealSlot = {
    id: string;
    date: string;
    mealType: MealType;
    assignments?: { participant: { id: string; name: string }; role: "COOK" | "HELPER" }[];
    recipes?: { recipe: { id: string; title: string } }[];
};

type Trip = { id: string; name: string; startDate: string; endDate: string };

type ParticipantRow = {
    id: string;
    name: string;
    cookingPreference: number;
    availabilities: { date: string }[];
};

export default function TripPage() {
    const params = useParams<{ tripId: string }>();
    const searchParams = useSearchParams();
    const tripId = params?.tripId as string;
    const locale = useLocale();
    const router = useRouter();

    const [trip, setTrip] = useState<Trip | null>(null);
    const [participants, setParticipants] = useState<ParticipantRow[]>([]);
    const [slots, setSlots] = useState<MealSlot[]>([]);
    const [recipes, setRecipes] = useState<Array<{ id: string; title: string; notes?: string | null; serves?: number | null }>>([]);
    const [invite, setInvite] = useState<{ id: string; token: string } | null>(null);

    const [tab, setTab] = useState<"plan" | "recipes" | "team" | "groceries">("plan");
    const [isLoading, setIsLoading] = useState(true);

    // Initialize tab from URL parameter, then from sessionStorage, then default to 'plan'
    useEffect(() => {
        if (!tripId) return;
        
        const validTabs = ['plan', 'recipes', 'team', 'groceries'];
        
        // First check URL parameter
        const urlTab = searchParams.get('tab');
        if (urlTab && validTabs.includes(urlTab)) {
            setTab(urlTab as "plan" | "recipes" | "team" | "groceries");
            return;
        }
        
        // Then check sessionStorage
        if (typeof window !== 'undefined') {
            const savedTab = sessionStorage.getItem(`trip-${tripId}-tab`);
            if (savedTab && validTabs.includes(savedTab)) {
                setTab(savedTab as "plan" | "recipes" | "team" | "groceries");
            }
        }
    }, [tripId, searchParams]);

    // Save tab state whenever it changes and update URL without navigation
    useEffect(() => {
        if (typeof window !== 'undefined' && tripId) {
            sessionStorage.setItem(`trip-${tripId}-tab`, tab);
            
            // Update URL without triggering navigation
            const currentParams = new URLSearchParams(window.location.search);
            if (tab !== 'plan') {
                currentParams.set('tab', tab);
            } else {
                currentParams.delete('tab');
            }
            
            const newUrl = `${window.location.pathname}${currentParams.toString() ? '?' + currentParams.toString() : ''}`;
            if (newUrl !== window.location.pathname + window.location.search) {
                window.history.replaceState(null, '', newUrl);
            }
        }
    }, [tab, tripId]);

    const refreshTrip = useCallback(async () => {
        if (!tripId) return;
        const res = await fetch(`/api/trips/${tripId}`, { cache: "no-store" });
        if (res.ok) setTrip(await res.json());
    }, [tripId]);

    const refreshParticipants = useCallback(async () => {
        if (!tripId) return;
        const res = await fetch(`/api/participants?tripId=${tripId}`, { cache: "no-store" });
        if (res.ok) setParticipants(await res.json());
    }, [tripId]);

    const refreshSchedule = useCallback(async () => {
        if (!tripId) return;
        const res = await fetch(`/api/trips/${tripId}/schedule`, { cache: "no-store" });
        const data = await res.json();
        setSlots(data);
    }, [tripId]);

    const refreshRecipes = useCallback(async () => {
        if (!tripId) return;
        const res = await fetch(`/api/recipes?tripId=${tripId}`, { cache: "no-store" });
        if (res.ok) setRecipes(await res.json());
    }, [tripId]);

    const refreshInvite = useCallback(async () => {
        if (!tripId) return;
        const res = await fetch(`/api/trips/${tripId}/invites`, { cache: "no-store" });
        if (res.ok) setInvite(await res.json());
    }, [tripId]);

    useEffect(() => {
        async function loadInitialData() {
            setIsLoading(true);
            await Promise.all([refreshTrip(), refreshParticipants(), refreshSchedule(), refreshRecipes(), refreshInvite()]);
            setIsLoading(false);
        }
        loadInitialData();
    }, [refreshTrip, refreshParticipants, refreshSchedule, refreshRecipes, refreshInvite]);

    const slotsByDate = useMemo(() => {
        const map = new Map<string, MealSlot[]>();
        for (const s of slots) {
            const key = formatISODate(new Date(s.date));
            const arr = map.get(key) ?? [];
            arr.push(s);
            map.set(key, arr);
        }
        return map;
    }, [slots]);

    const totalMeals = slots.length;
    const participantCount = participants.length;
    const tripDaysSet = useMemo(() => {
        if (!trip) return new Set<string>();
        return new Set(enumerateUtcYmdInclusive(trip.startDate, trip.endDate));
    }, [trip]);

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <Loader size="lg" text="Loading trip data..." className="py-20" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <TripHeader 
                trip={trip}
                invite={invite}
                tripId={tripId}
                onScheduleRefresh={refreshSchedule}
                onRecipeRefresh={refreshRecipes}
            />

            <StatGrid participantCount={participantCount} totalMeals={totalMeals} recipesCount={recipes.length} tripDaysSet={tripDaysSet} />

            <TabNavigation tab={tab} onTabChange={setTab} />

            {tab === "plan" && (
                <PlanTab
                    trip={trip}
                    tripId={tripId}
                    slots={slots}
                    slotsByDate={slotsByDate}
                    recipes={recipes}
                    participantCount={participantCount}
                    totalMeals={totalMeals}
                    tripDaysSet={tripDaysSet}
                    onScheduleRefresh={refreshSchedule}
                />
            )}

            {tab === "team" && (
                <TeamTab
                    trip={trip}
                    tripId={tripId}
                    participants={participants}
                    onParticipantsRefresh={refreshParticipants}
                    onScheduleRefresh={refreshSchedule}
                />
            )}

            {tab === "groceries" && (
                <GroceriesTab tripId={tripId} trip={trip} />
            )}

            {tab === "recipes" && (
                <RecipesTab
                    tripId={tripId}
                    recipes={recipes}
                    slots={slots}
                    slotsByDate={slotsByDate}
                    onRecipeRefresh={refreshRecipes}
                    onScheduleRefresh={refreshSchedule}
                />
            )}
        </div>
    );
}
