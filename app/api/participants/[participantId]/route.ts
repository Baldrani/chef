import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/participants\/([^/]+)/);
    const participantId = match?.[1];
    if (!participantId) return NextResponse.json({ error: "participantId missing in path" }, { status: 400 });

    const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        include: { availabilities: true },
    });
    if (!participant) return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    return NextResponse.json(participant);
}

const UpdateParticipantSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().nullable().optional(),
    cookingPreference: z.number().min(-2).max(2).optional(),
    dietaryRestrictions: z.string().nullable().optional(),
    availabilityDates: z.array(z.string()).optional(), // Array of ISO date strings
});

export async function PUT(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/participants\/([^/]+)/);
    const participantId = match?.[1];
    if (!participantId) return NextResponse.json({ error: "participantId missing in path" }, { status: 400 });

    const body = await req.json();
    const parsed = UpdateParticipantSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const { name, email, cookingPreference, dietaryRestrictions, availabilityDates } = parsed.data;

    try {
        await prisma.$transaction(async (tx) => {
            // Update participant basic info
            const updateData: {
                name?: string;
                email?: string | null;
                cookingPreference?: number;
                dietaryRestrictions?: string | null;
            } = {};
            if (name !== undefined) updateData.name = name;
            if (email !== undefined) updateData.email = email;
            if (cookingPreference !== undefined) updateData.cookingPreference = cookingPreference;
            if (dietaryRestrictions !== undefined) updateData.dietaryRestrictions = dietaryRestrictions;

            if (Object.keys(updateData).length > 0) {
                await tx.participant.update({
                    where: { id: participantId },
                    data: updateData,
                });
            }

            // Update availability dates if provided
            if (availabilityDates !== undefined) {
                // Remove existing availabilities
                await tx.participantAvailability.deleteMany({
                    where: { participantId },
                });

                // Add new availabilities
                if (availabilityDates.length > 0) {
                    await tx.participantAvailability.createMany({
                        data: availabilityDates.map(dateStr => ({
                            participantId,
                            date: new Date(dateStr),
                        })),
                    });
                }
            }
        });

        // Return updated participant
        const updatedParticipant = await prisma.participant.findUnique({
            where: { id: participantId },
            include: { availabilities: true },
        });

        return NextResponse.json(updatedParticipant);
    } catch (error) {
        console.error("Error updating participant:", error);
        return NextResponse.json({ error: "Failed to update participant" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/participants\/([^/]+)/);
    const participantId = match?.[1];
    if (!participantId) return NextResponse.json({ error: "participantId missing in path" }, { status: 400 });

    await prisma.$transaction(async tx => {
        await tx.assignment.deleteMany({ where: { participantId } });
        await tx.participantAvailability.deleteMany({ where: { participantId } });
        await tx.participant.delete({ where: { id: participantId } });
    });

    return NextResponse.json({ ok: true });
}
