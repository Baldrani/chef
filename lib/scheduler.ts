import { isSameDay, startOfDay } from "date-fns";
import prisma from "./prisma";
import type { Assignment, Participant } from "@prisma/client";

export type GenerateScheduleOptions = {
    tripId: string;
    maxCooksPerMeal?: number;
    maxHelpersPerMeal?: number;
    avoidConsecutive?: boolean; // avoid assigning same person on back-to-back meal slots by date order
    autoAssignRecipes?: boolean;
    recipesPerMeal?: number;
};

type ParticipantWithMeta = Participant & {
    availabilityDates: Date[];
    currentAssignments: number;
    weight: number;
    lastAssignedIndex?: number; // index of last slot assigned in the ordered mealSlots list
};

function weightFromPreference(pref: number): number {
    const clamped = Math.max(-2, Math.min(2, pref));
    const map = { "-2": 0.6, "-1": 0.85, "0": 1.0, "1": 1.2, "2": 1.4 } as const;
    return map[String(clamped) as "-2" | "-1" | "0" | "1" | "2"];
}

function isAvailableOnDate(participant: ParticipantWithMeta, date: Date): boolean {
    return participant.availabilityDates.some(d => isSameDay(d, date));
}

export async function generateSchedule({
    tripId,
    maxCooksPerMeal = 2,
    maxHelpersPerMeal = 0,
    avoidConsecutive = true,
    autoAssignRecipes = false,
    recipesPerMeal = 1,
}: GenerateScheduleOptions) {
    const [participantsRaw, mealSlots, recipes] = await Promise.all([
        prisma.participant.findMany({
            where: { tripId },
            include: { availabilities: true, assignments: true },
        }),
        prisma.mealSlot.findMany({ where: { tripId }, orderBy: [{ date: "asc" }, { mealType: "asc" }] }),
        autoAssignRecipes ? prisma.recipe.findMany({ where: { tripId }, orderBy: { createdAt: "asc" } }) : Promise.resolve([] as Array<{ id: string }>),
    ]);

    const participants: ParticipantWithMeta[] = participantsRaw.map(p => ({
        ...p,
        availabilityDates: p.availabilities.map(a => startOfDay(a.date)),
        currentAssignments: p.assignments.length,
        weight: weightFromPreference(p.cookingPreference),
    }));

    const plannedAssignments: Array<Pick<Assignment, "mealSlotId" | "participantId" | "role">> = [];
    const plannedRecipeAssignments: Array<{ mealSlotId: string; recipeId: string }> = [];

    // When auto-assigning recipes, keep existing manual assignments and only fill gaps
    const currentRecipeAssignments = autoAssignRecipes ? await prisma.recipeAssignment.findMany({ where: { mealSlotId: { in: mealSlots.map(s => s.id) } } }) : [];
    const existingBySlot = new Map<string, Set<string>>();
    for (const a of currentRecipeAssignments) {
        const set = existingBySlot.get(a.mealSlotId) ?? new Set<string>();
        set.add(a.recipeId);
        existingBySlot.set(a.mealSlotId, set);
    }

    const slotIndexById = new Map<string, number>();
    mealSlots.forEach((s, idx) => slotIndexById.set(s.id, idx));

    for (let slotIdx = 0; slotIdx < mealSlots.length; slotIdx++) {
        const slot = mealSlots[slotIdx];
        const available = participants.filter(p => isAvailableOnDate(p, startOfDay(slot.date)));

        available.sort((a, b) => a.currentAssignments / a.weight - b.currentAssignments / b.weight);

        function pickPeople(count: number, role: "COOK" | "HELPER") {
            let picked = 0;
            for (const candidate of available) {
                if (picked >= count) break;
                if (avoidConsecutive && candidate.lastAssignedIndex === slotIdx - 1) continue;
                // avoid duplicate assignment in same slot
                if (plannedAssignments.some(a => a.mealSlotId === slot.id && a.participantId === candidate.id)) continue;
                plannedAssignments.push({ mealSlotId: slot.id, participantId: candidate.id, role });
                candidate.currentAssignments += 1;
                candidate.lastAssignedIndex = slotIdx;
                picked += 1;
            }
        }

        pickPeople(Math.min(maxCooksPerMeal, available.length), "COOK");
        if (maxHelpersPerMeal > 0) pickPeople(Math.min(maxHelpersPerMeal, available.length), "HELPER");

        if (autoAssignRecipes && recipes.length > 0 && recipesPerMeal > 0) {
            const existing = existingBySlot.get(slot.id) ?? new Set<string>();
            const deficit = Math.max(0, recipesPerMeal - existing.size);
            for (let addIdx = 0; addIdx < deficit; addIdx++) {
                const rr = recipes[(slotIdx * recipesPerMeal + addIdx) % recipes.length];
                if (existing.has(rr.id)) continue;
                if (!plannedRecipeAssignments.some(a => a.mealSlotId === slot.id && a.recipeId === rr.id)) {
                    plannedRecipeAssignments.push({ mealSlotId: slot.id, recipeId: rr.id });
                    existing.add(rr.id);
                }
            }
        }
    }

    await prisma.$transaction(async tx => {
        const bySlot = new Map<string, Array<Pick<Assignment, "mealSlotId" | "participantId" | "role">>>();
        for (const a of plannedAssignments) {
            const arr = bySlot.get(a.mealSlotId) ?? [];
            arr.push(a);
            bySlot.set(a.mealSlotId, arr);
        }
        for (const [mealSlotId, arr] of bySlot.entries()) {
            await tx.assignment.deleteMany({ where: { mealSlotId } });
            if (arr.length > 0) await tx.assignment.createMany({ data: arr });
        }

        if (autoAssignRecipes && plannedRecipeAssignments.length > 0) {
            await tx.recipeAssignment.createMany({ data: plannedRecipeAssignments, skipDuplicates: true });
        }
    });

    return { ok: true, assignedParticipants: plannedAssignments.length, addedRecipeAssignments: plannedRecipeAssignments.length };
}
