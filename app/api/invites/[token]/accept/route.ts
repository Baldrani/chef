import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { parseDateOnlyToUtcNoon } from "@/lib/dates";

const Body = z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    cookingPreference: z.number().int().min(-2).max(2).default(0),
    availability: z.array(z.string().date()).default([]),
});

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/invites\/([^/]+)\/accept/);
    const token = match?.[1];
    if (!token) return NextResponse.json({ error: "token missing" }, { status: 400 });

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) return NextResponse.json({ error: "invalid invite" }, { status: 404 });
    if (invite.expiresAt && invite.expiresAt < new Date()) return NextResponse.json({ error: "invite expired" }, { status: 400 });
    if (invite.usesRemaining !== null && invite.usesRemaining !== undefined && invite.usesRemaining <= 0) {
        return NextResponse.json({ error: "invite exhausted" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = Body.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const { name, email, cookingPreference, availability } = parsed.data;

    const result = await prisma.$transaction(async tx => {
        const participant = await tx.participant.create({
            data: {
                tripId: invite.tripId,
                name,
                email: email || null,
                cookingPreference,
                availabilities: { create: availability.map(d => ({ date: parseDateOnlyToUtcNoon(d) })) },
            },
        });

        if (invite.usesRemaining !== null && invite.usesRemaining !== undefined) {
            await tx.invite.update({ where: { id: invite.id }, data: { usesRemaining: invite.usesRemaining - 1 } });
        }

        return participant;
    });

    return NextResponse.json(result);
}
