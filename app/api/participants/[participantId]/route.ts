import { NextRequest, NextResponse } from "next/server";
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
