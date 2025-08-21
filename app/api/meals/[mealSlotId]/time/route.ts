import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const updateTimeSchema = z.object({
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable()
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ mealSlotId: string }> }
) {
    try {
        const { mealSlotId } = await params;
        const body = await req.json();
        const { startTime } = updateTimeSchema.parse(body);

        const meal = await prisma.mealSlot.update({
            where: { id: mealSlotId },
            data: { startTime },
            include: {
                assignments: { include: { participant: true } },
                recipes: { include: { recipe: true } }
            }
        });

        return NextResponse.json(meal);
    } catch (error) {
        console.error("Failed to update meal time:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid time format. Use HH:MM format (e.g., '08:30')" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to update meal time" },
            { status: 500 }
        );
    }
}