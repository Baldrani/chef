import { isSameDay, startOfDay, differenceInDays } from "date-fns";
import prisma from "./prisma";
import type { Assignment, Participant } from "@prisma/client";

export type GenerateScheduleOptions = {
    tripId: string;
    maxCooksPerMeal?: number;
    maxHelpersPerMeal?: number;
    avoidConsecutive?: boolean;
    autoAssignRecipes?: boolean;
    recipesPerMeal?: number;
    prioritizeEqualParticipation?: boolean; // New parameter for hybrid approach
};

type ParticipantWithMeta = Participant & {
    availabilityDates: Date[];
    currentAssignments: number;
    presenceRatio: number; // fraction of trip days they're available
    targetAssignments: number; // fair share based on availability
    assignmentDeficit: number; // how many assignments behind fair share
    maxAssignments: number; // hard cap to prevent over-assignment
    lastAssignedDate?: Date; // actual date of last assignment for temporal spacing
    skillWeight: number; // cooking preference converted to weight
};

type TeamCandidate = {
    participants: ParticipantWithMeta[];
    roles: ("COOK" | "HELPER")[];
    score: number;
};

type MealAssignment = {
    mealSlotId: string;
    team: TeamCandidate;
    date: Date;
};

// Enhanced skill weighting - more extreme to encourage strategic pairing
function skillWeightFromPreference(pref: number): number {
    const clamped = Math.max(-2, Math.min(2, pref));
    const map = { "-2": 0.3, "-1": 0.6, "0": 1.0, "1": 1.5, "2": 2.0 } as const;
    return map[String(clamped) as "-2" | "-1" | "0" | "1" | "2"];
}

function isAvailableOnDate(participant: ParticipantWithMeta, date: Date): boolean {
    return participant.availabilityDates.some(d => isSameDay(d, date));
}

// Calculate days since last assignment for temporal spacing
function daysSinceLastAssignment(participant: ParticipantWithMeta, currentDate: Date): number {
    if (!participant.lastAssignedDate) return 999; // Never assigned = infinite rest
    return Math.max(0, differenceInDays(currentDate, participant.lastAssignedDate));
}

// Score a team composition based on multiple factors
function scoreTeamComposition(team: ParticipantWithMeta[], mealDate: Date, prioritizeEquality = false): number {
    if (team.length === 0) return 0;

    let score = 0;
    const preferences = team.map(p => p.cookingPreference);
    
    // Check for hard assignment limits - immediate disqualification
    for (const participant of team) {
        if (participant.currentAssignments >= participant.maxAssignments) {
            return -1000; // Hard disqualification for exceeding limits
        }
    }
    
    // Adjust weights based on prioritization mode
    const skillWeight = prioritizeEquality ? 0.2 : 0.4;      // Reduced when prioritizing equality
    const equityWeight = prioritizeEquality ? 0.6 : 0.35;    // Increased when prioritizing equality  
    const temporalWeight = prioritizeEquality ? 0.2 : 0.25;  // Slightly reduced when prioritizing equality

    // 1. SKILL COMPLEMENTARITY SCORING
    const avgPreference = preferences.reduce((sum, pref) => sum + pref, 0) / preferences.length;
    const hasEnthusiast = preferences.some(p => p >= 1);
    const hasReluctant = preferences.some(p => p <= -1);
    const allNegative = preferences.every(p => p < 0);
    
    let skillScore = 0;
    if (hasEnthusiast && hasReluctant) {
        skillScore += 100; // Excellent complementarity - enthusiast + reluctant
    } else if (hasEnthusiast) {
        skillScore += 70; // Good - has someone who likes cooking
    } else if (allNegative) {
        skillScore -= 50; // Poor - all people who dislike cooking
    }
    
    // Bonus for balanced preferences
    const prefVariance = preferences.reduce((sum, pref) => sum + Math.pow(pref - avgPreference, 2), 0) / preferences.length;
    skillScore += Math.min(30, prefVariance * 10); // More diverse = better
    
    score += skillScore * skillWeight;

    // 2. EQUITY SCORING (Enhanced for hybrid approach)
    let equityScore = 0;
    for (const participant of team) {
        // Enhanced bonus for people behind their fair share
        const deficitBonus = Math.max(0, participant.assignmentDeficit);
        if (prioritizeEquality) {
            // Much stronger equity bonuses when prioritizing equality
            equityScore += deficitBonus * 60; // Increased from 25
        } else {
            equityScore += deficitBonus * 35; // Increased from 25
        }
        
        // Enhanced penalty for people over their fair share
        const overAssignmentPenalty = Math.max(0, -participant.assignmentDeficit);
        if (prioritizeEquality) {
            // Massive penalty when prioritizing equality
            equityScore -= overAssignmentPenalty * 120; // Increased from 40
        } else {
            // Strong penalty in balanced mode
            equityScore -= overAssignmentPenalty * 80; // Increased from 40
        }
        
        // Additional penalty as they approach their hard limit
        const approachingLimit = participant.maxAssignments - participant.currentAssignments;
        if (approachingLimit <= 1) {
            equityScore -= 50; // Discourage near-limit assignments
        } else if (approachingLimit <= 2) {
            equityScore -= 25; // Mild penalty for getting close
        }
    }
    
    score += equityScore * equityWeight;

    // 3. TEMPORAL SPACING SCORING
    let temporalScore = 0;
    for (const participant of team) {
        const daysSinceAssignment = daysSinceLastAssignment(participant, mealDate);
        
        if (daysSinceAssignment === 0) {
            temporalScore -= 100; // Same day assignment (should be impossible but just in case)
        } else if (daysSinceAssignment === 1) {
            temporalScore -= 80; // Consecutive day - heavily penalized
        } else if (daysSinceAssignment === 2) {
            temporalScore -= 30; // Next day - still bad
        } else if (daysSinceAssignment >= 3 && daysSinceAssignment <= 5) {
            temporalScore += 20; // Ideal spacing
        } else if (daysSinceAssignment > 5) {
            temporalScore += Math.min(40, daysSinceAssignment * 3); // Longer rest = better (capped)
        }
    }
    
    score += temporalScore * temporalWeight;

    return score;
}

// Generate all possible team combinations for a meal
function generateTeamCandidates(
    availableParticipants: ParticipantWithMeta[], 
    maxCooks: number, 
    maxHelpers: number,
    mealDate: Date,
    prioritizeEquality = false
): TeamCandidate[] {
    const teams: TeamCandidate[] = [];
    const totalSlots = maxCooks + maxHelpers;
    
    // Generate combinations of participants for this meal
    function generateCombinations(participants: ParticipantWithMeta[], size: number): ParticipantWithMeta[][] {
        if (size === 0) return [[]];
        if (participants.length === 0 || size > participants.length) return [];
        
        const [first, ...rest] = participants;
        const withFirst = generateCombinations(rest, size - 1).map(combo => [first, ...combo]);
        const withoutFirst = generateCombinations(rest, size);
        
        return [...withFirst, ...withoutFirst];
    }
    
    // Generate teams of different sizes (from 1 to totalSlots, but at least 1 cook)
    for (let teamSize = Math.min(1, totalSlots); teamSize <= Math.min(totalSlots, availableParticipants.length); teamSize++) {
        const combinations = generateCombinations(availableParticipants, teamSize);
        
        for (const combination of combinations) {
            // Determine roles - prioritize people who like cooking as cooks
            const cooks = Math.min(maxCooks, teamSize);
            const helpers = teamSize - cooks;
            
            const roles: ("COOK" | "HELPER")[] = [
                ...Array(cooks).fill("COOK"),
                ...Array(helpers).fill("HELPER")
            ];
            
            const score = scoreTeamComposition(combination, mealDate, prioritizeEquality);
            teams.push({
                participants: combination,
                roles,
                score
            });
        }
    }
    
    // Sort by score (best first) and limit to top candidates to prevent combinatorial explosion
    return teams.sort((a, b) => b.score - a.score).slice(0, 50);
}

export async function generateSchedule({
    tripId,
    maxCooksPerMeal = 2,
    maxHelpersPerMeal = 0,
    autoAssignRecipes = false,
    recipesPerMeal = 1,
    prioritizeEqualParticipation = false,
}: GenerateScheduleOptions) {
    const [participantsRaw, mealSlots, recipes, trip] = await Promise.all([
        prisma.participant.findMany({
            where: { tripId },
            include: { availabilities: true, assignments: true },
        }),
        prisma.mealSlot.findMany({ 
            where: { tripId }, 
            orderBy: [{ date: "asc" }, { mealType: "asc" }] 
        }),
        autoAssignRecipes ? prisma.recipe.findMany({ 
            where: { tripId }, 
            orderBy: { createdAt: "asc" } 
        }) : Promise.resolve([] as Array<{ id: string }>),
        prisma.trip.findUnique({ where: { id: tripId } })
    ]);

    if (!trip) throw new Error("Trip not found");

    const tripStart = startOfDay(trip.startDate);
    const tripEnd = startOfDay(trip.endDate);
    const totalTripDays = differenceInDays(tripEnd, tripStart) + 1;
    const totalMeals = mealSlots.length;

    // PHASE 1: PARTICIPANT ANALYSIS - Calculate equity metrics
    const participants: ParticipantWithMeta[] = participantsRaw.map(p => {
        const availabilityDates = p.availabilities.map(a => startOfDay(a.date));
        const availableDays = availabilityDates.length;
        const presenceRatio = availableDays / totalTripDays;
        const fairShare = Math.round(totalMeals * presenceRatio);
        const currentAssignments = p.assignments.length;
        
        // Calculate hard assignment limit - prevents over-assignment of cooking enthusiasts
        // Formula: fair share + buffer (minimum 2, maximum based on total meals)
        const baseLimit = Math.max(fairShare, 1);
        const bufferLimit = Math.ceil(totalMeals / participantsRaw.length) + 2; // Average + buffer
        const maxAssignments = Math.min(baseLimit + 2, bufferLimit, Math.ceil(totalMeals * 0.6)); // Cap at 60% of total meals
        
        // Find their most recent assignment date for temporal spacing
        const lastAssignment = p.assignments
            .map(a => a.createdAt)
            .sort((a, b) => b.getTime() - a.getTime())[0];

        return {
            ...p,
            availabilityDates,
            currentAssignments,
            presenceRatio,
            targetAssignments: Math.max(1, fairShare), // Everyone should cook at least once if available
            assignmentDeficit: fairShare - currentAssignments,
            maxAssignments, // New hard limit
            lastAssignedDate: lastAssignment ? startOfDay(lastAssignment) : undefined,
            skillWeight: skillWeightFromPreference(p.cookingPreference),
        };
    });

    console.log("🧮 Participant Analysis (Equal Participation:", prioritizeEqualParticipation ? "ON" : "OFF", "):");
    participants.forEach(p => {
        console.log(`  ${p.name}: Available ${p.availabilityDates.length}/${totalTripDays} days (${Math.round(p.presenceRatio * 100)}%), Target: ${p.targetAssignments}, Current: ${p.currentAssignments}, Max: ${p.maxAssignments}, Deficit: ${p.assignmentDeficit}`);
    });

    // PHASE 2: OPTIMIZED ASSIGNMENT USING TEAM SCORING
    const finalAssignments: MealAssignment[] = [];
    const workingParticipants = participants.map(p => ({ ...p })); // Copy for modifications

    for (const slot of mealSlots) {
        const slotDate = startOfDay(slot.date);
        const availableForSlot = workingParticipants.filter(p => isAvailableOnDate(p, slotDate));
        
        if (availableForSlot.length === 0) {
            console.log(`⚠️  No participants available for ${slot.mealType} on ${slotDate.toISOString().split('T')[0]}`);
            continue;
        }

        // Generate all possible team combinations for this meal
        const teamCandidates = generateTeamCandidates(
            availableForSlot, 
            maxCooksPerMeal, 
            maxHelpersPerMeal,
            slotDate,
            prioritizeEqualParticipation
        );

        if (teamCandidates.length === 0) {
            console.log(`⚠️  No valid teams for ${slot.mealType} on ${slotDate.toISOString().split('T')[0]}`);
            continue;
        }

        // Select the best team
        const bestTeam = teamCandidates[0];
        console.log(`🍽️  ${slot.mealType} ${slotDate.toISOString().split('T')[0]}: Selected team (score: ${bestTeam.score.toFixed(1)}) - ${bestTeam.participants.map(p => p.name).join(', ')}`);

        finalAssignments.push({
            mealSlotId: slot.id,
            team: bestTeam,
            date: slotDate
        });

        // Update participant state for future assignments
        bestTeam.participants.forEach(participant => {
            const workingP = workingParticipants.find(p => p.id === participant.id)!;
            workingP.currentAssignments += 1;
            workingP.assignmentDeficit -= 1;
            workingP.lastAssignedDate = slotDate;
        });
    }

    // PHASE 3: CONVERT TO DATABASE FORMAT AND SAVE
    const plannedAssignments: Array<Pick<Assignment, "mealSlotId" | "participantId" | "role">> = [];
    
    for (const assignment of finalAssignments) {
        assignment.team.participants.forEach((participant, index) => {
            plannedAssignments.push({
                mealSlotId: assignment.mealSlotId,
                participantId: participant.id,
                role: assignment.team.roles[index]
            });
        });
    }

    // Handle recipe assignments (unchanged from original)
    const plannedRecipeAssignments: Array<{ mealSlotId: string; recipeId: string }> = [];
    const currentRecipeAssignments = autoAssignRecipes ? await prisma.recipeAssignment.findMany({ 
        where: { mealSlotId: { in: mealSlots.map(s => s.id) } } 
    }) : [];
    const existingBySlot = new Map<string, Set<string>>();
    for (const a of currentRecipeAssignments) {
        const set = existingBySlot.get(a.mealSlotId) ?? new Set<string>();
        set.add(a.recipeId);
        existingBySlot.set(a.mealSlotId, set);
    }

    if (autoAssignRecipes && recipes.length > 0 && recipesPerMeal > 0) {
        mealSlots.forEach((slot, slotIdx) => {
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
        });
    }

    // Save to database
    await prisma.$transaction(async tx => {
        // Clear existing assignments
        await tx.assignment.deleteMany({ where: { mealSlotId: { in: mealSlots.map(s => s.id) } } });
        
        // Create new assignments
        if (plannedAssignments.length > 0) {
            await tx.assignment.createMany({ data: plannedAssignments });
        }

        if (autoAssignRecipes && plannedRecipeAssignments.length > 0) {
            await tx.recipeAssignment.createMany({ data: plannedRecipeAssignments, skipDuplicates: true });
        }
    });

    // Calculate final statistics
    const finalStats = participants.map(p => {
        const newAssignments = plannedAssignments.filter(a => a.participantId === p.id).length;
        return {
            name: p.name,
            targetAssignments: p.targetAssignments,
            finalAssignments: newAssignments,
            presenceRatio: p.presenceRatio
        };
    });

    console.log("📊 Final Assignment Summary:");
    finalStats.forEach(stat => {
        console.log(`  ${stat.name}: ${stat.finalAssignments}/${stat.targetAssignments} meals (${Math.round(stat.presenceRatio * 100)}% presence)`);
    });

    return { 
        ok: true, 
        assignedParticipants: plannedAssignments.length, 
        addedRecipeAssignments: plannedRecipeAssignments.length,
        stats: finalStats
    };
}
