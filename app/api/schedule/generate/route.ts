import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateSchedule } from "@/lib/scheduler";

const Schema = z.object({
    tripId: z.string().min(1),
    maxCooksPerMeal: z.number().int().min(1).max(6).optional(),
    maxHelpersPerMeal: z.number().int().min(0).max(6).optional(),
    avoidConsecutive: z.boolean().optional(),
    autoAssignRecipes: z.boolean().optional(),
    recipesPerMeal: z.number().int().min(1).max(5).optional(),
    prioritizeEqualParticipation: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    const result = await generateSchedule(parsed.data);
    return NextResponse.json(result);
}
