import { isSameDay, startOfDay } from "date-fns";
import prisma from "./prisma";
import type { Assignment, Participant } from "@prisma/client";

export type GenerateScheduleOptions = {
    tripId: string;
    maxCooksPerMeal?: number;
    maxHelpersPerMeal?: number;
    avoidConsecutive?: boolean; // avoid assigning same person on back-to-back meal slots by date order
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

export async function generateSchedule({ tripId, maxCooksPerMeal = 2, maxHelpersPerMeal = 0, avoidConsecutive = true }: GenerateScheduleOptions) {
    const [participantsRaw, mealSlots] = await Promise.all([
        prisma.participant.findMany({
            where: { tripId },
            include: { availabilities: true, assignments: true },
        }),
        prisma.mealSlot.findMany({ where: { tripId }, orderBy: [{ date: "asc" }, { mealType: "asc" }] }),
    ]);

    const participants: ParticipantWithMeta[] = participantsRaw.map(p => ({
        ...p,
        availabilityDates: p.availabilities.map(a => startOfDay(a.date)),
        currentAssignments: p.assignments.length,
        weight: weightFromPreference(p.cookingPreference),
    }));

    const plannedAssignments: Array<Pick<Assignment, "mealSlotId" | "participantId" | "role">> = [];

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
    });

    return { ok: true, assigned: plannedAssignments.length };
}
