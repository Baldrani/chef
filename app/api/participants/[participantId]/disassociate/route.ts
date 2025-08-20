import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/participants\/([^/]+)\/disassociate/);
    const participantId = match?.[1];
    if (!participantId) return NextResponse.json({ error: "participantId missing in path" }, { status: 400 });

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "authentication required" }, { status: 401 });
    }

    try {
        const participant = await prisma.participant.findUnique({
            where: { id: participantId },
            include: { trip: true },
        });

        if (!participant) {
            return NextResponse.json({ error: "participant not found" }, { status: 404 });
        }

        // Check if user has permission (either they're the associated user or they created the trip)
        const hasPermission = 
            participant.userId === session.user.id || // User is associated with this participant
            participant.trip.createdBy === session.user.id; // User created the trip (admin)

        if (!hasPermission) {
            return NextResponse.json({ error: "insufficient permissions" }, { status: 403 });
        }

        // Disassociate the user
        const updatedParticipant = await prisma.participant.update({
            where: { id: participantId },
            data: { userId: null },
            include: { user: true },
        });

        return NextResponse.json({ 
            success: true, 
            participant: updatedParticipant,
            message: "User successfully disassociated from participant" 
        });

    } catch (error) {
        console.error("Error disassociating participant:", error);
        return NextResponse.json({ error: "failed to disassociate participant" }, { status: 500 });
    }
}