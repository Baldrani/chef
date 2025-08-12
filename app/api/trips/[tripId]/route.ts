import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/trips\/([^/]+)/);
    const tripId = match?.[1];
    if (!tripId) return NextResponse.json({ error: "tripId missing in path" }, { status: 400 });

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(trip);
}

const UpdateTripSchema = z.object({
    name: z.string().min(1).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
}).refine(
    data => data.name !== undefined || data.startDate !== undefined || data.endDate !== undefined,
    { message: "At least one field must be provided" }
).refine(
    data => {
        if (data.startDate && data.endDate) {
            return new Date(data.startDate) <= new Date(data.endDate);
        }
        return true;
    },
    { message: "Start date must be before or equal to end date" }
);

export async function PATCH(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/trips\/([^/]+)/);
    const tripId = match?.[1];
    if (!tripId) return NextResponse.json({ error: "tripId missing in path" }, { status: 400 });

    const body = await req.json();
    const parsed = UpdateTripSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const { name, startDate, endDate } = parsed.data;

    try {
        // Check if trip exists
        const existingTrip = await prisma.trip.findUnique({ where: { id: tripId } });
        if (!existingTrip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

        // Prepare update data
        const updateData: { name?: string; startDate?: Date; endDate?: Date } = {};
        if (name !== undefined) updateData.name = name;
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = new Date(endDate);

        // If dates are being updated, validate against existing meal slots
        if (updateData.startDate || updateData.endDate) {
            const finalStartDate = updateData.startDate || existingTrip.startDate;
            const finalEndDate = updateData.endDate || existingTrip.endDate;

            // Check if any existing meal slots fall outside the new date range
            const conflictingSlots = await prisma.mealSlot.count({
                where: {
                    tripId,
                    OR: [
                        { date: { lt: finalStartDate } },
                        { date: { gt: finalEndDate } }
                    ]
                }
            });

            if (conflictingSlots > 0) {
                return NextResponse.json({ 
                    error: "Cannot update dates: existing meal slots fall outside the new date range. Please remove conflicting meals first." 
                }, { status: 400 });
            }
        }

        // Update the trip
        const updatedTrip = await prisma.trip.update({
            where: { id: tripId },
            data: updateData
        });

        return NextResponse.json(updatedTrip);
    } catch (error) {
        console.error("Error updating trip:", error);
        return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
    }
}
