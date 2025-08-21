import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const updateMealTimesSchema = z.object({
    defaultBreakfastTime: z.string().regex(timeRegex).nullable().optional(),
    defaultLunchTime: z.string().regex(timeRegex).nullable().optional(),
    defaultDinnerTime: z.string().regex(timeRegex).nullable().optional()
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ tripId: string }> }
) {
    try {
        const { tripId } = await params;
        const body = await req.json();
        const updateData = updateMealTimesSchema.parse(body);

        // Remove undefined values to only update provided fields
        const cleanData = Object.fromEntries(
            Object.entries(updateData).filter(([_, value]) => value !== undefined)
        );

        const trip = await prisma.trip.update({
            where: { id: tripId },
            data: cleanData
        });

        return NextResponse.json(trip);
    } catch (error) {
        console.error("Failed to update trip meal times:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid time format. Use HH:MM format (e.g., '08:30')" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to update trip meal times" },
            { status: 500 }
        );
    }
}