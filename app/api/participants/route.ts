import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { parseDateOnlyToUtcNoon } from "@/lib/dates";

const JoinSchema = z.object({
    tripId: z.string().min(1),
    name: z.string().min(1),
    cookingPreference: z.number().int().min(-2).max(2),
    availability: z.array(z.string().date()).min(1),
});

export async function POST(req: NextRequest) {
    const body = await req.json();
    const parsed = JoinSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    const { tripId, name, cookingPreference, availability } = parsed.data;

    const participant = await prisma.participant.create({
        data: {
            tripId,
            name,
            cookingPreference,
            availabilities: { create: availability.map(d => ({ date: parseDateOnlyToUtcNoon(d) })) },
        },
        include: { availabilities: true },
    });

    return NextResponse.json(participant);
}

export async function GET(req: NextRequest) {
    const tripId = new URL(req.url).searchParams.get("tripId");
    if (!tripId) return NextResponse.json({ error: "tripId required" }, { status: 400 });
    const participants = await prisma.participant.findMany({ 
        where: { tripId }, 
        include: { 
            availabilities: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: { name: "asc" }
    });
    return NextResponse.json(participants);
}
