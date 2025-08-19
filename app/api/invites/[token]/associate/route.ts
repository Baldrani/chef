import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const Body = z.object({
    participantId: z.string().min(1),
});

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/invites\/([^/]+)\/associate/);
    const token = match?.[1];
    if (!token) return NextResponse.json({ error: "token missing" }, { status: 400 });

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "authentication required" }, { status: 401 });
    }

    const invite = await prisma.invite.findUnique({
        where: { token },
    });
    if (!invite) return NextResponse.json({ error: "invalid invite" }, { status: 404 });
    if (invite.expiresAt && invite.expiresAt < new Date()) {
        return NextResponse.json({ error: "invite expired" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = Body.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const { participantId } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
        // Verify the participant exists, belongs to this trip, and is not already associated
        const participant = await tx.participant.findFirst({
            where: {
                id: participantId,
                tripId: invite.tripId,
                userId: null, // Must not already be associated
            },
        });

        if (!participant) {
            throw new Error("Participant not found or already associated");
        }

        // Check if this user is already associated with a participant in this trip
        const existingAssociation = await tx.participant.findFirst({
            where: {
                tripId: invite.tripId,
                userId: session.user.id,
            },
        });

        if (existingAssociation) {
            throw new Error("User is already associated with a participant in this trip");
        }

        // Associate the user with the participant
        const updatedParticipant = await tx.participant.update({
            where: { id: participantId },
            data: { userId: session.user.id },
        });

        // Update invite usage if applicable
        if (invite.usesRemaining !== null && invite.usesRemaining !== undefined) {
            await tx.invite.update({
                where: { id: invite.id },
                data: { usesRemaining: invite.usesRemaining - 1 },
            });
        }

        return updatedParticipant;
    });

    return NextResponse.json(result);
}