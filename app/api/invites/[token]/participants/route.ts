import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/invites\/([^/]+)\/participants/);
    const token = match?.[1];
    if (!token) return NextResponse.json({ error: "token missing" }, { status: 400 });

    const invite = await prisma.invite.findUnique({
        where: { token },
        include: { trip: { select: { id: true } } },
    });
    if (!invite) return NextResponse.json({ error: "invalid invite" }, { status: 404 });
    if (invite.expiresAt && invite.expiresAt < new Date()) {
        return NextResponse.json({ error: "invite expired" }, { status: 400 });
    }

    // Get all participants for this trip that are not already associated with a user
    const participants = await prisma.participant.findMany({
        where: {
            tripId: invite.tripId,
            userId: null, // Only unassociated participants
        },
        select: {
            id: true,
            name: true,
            email: true,
            cookingPreference: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    return NextResponse.json({ participants });
}