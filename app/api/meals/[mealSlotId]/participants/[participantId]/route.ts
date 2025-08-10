import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function DELETE(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/meals\/([^/]+)\/participants\/([^/]+)/);
    const mealSlotId = match?.[1];
    const participantId = match?.[2];
    if (!mealSlotId || !participantId) return NextResponse.json({ error: "mealSlotId and participantId required" }, { status: 400 });

    await prisma.assignment.deleteMany({ where: { mealSlotId, participantId } });
    return NextResponse.json({ ok: true });
}

const UpsertSchema = z.object({ role: z.enum(["COOK", "HELPER"]) });

export async function PUT(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/meals\/([^/]+)\/participants\/([^/]+)/);
    const mealSlotId = match?.[1];
    const participantId = match?.[2];
    if (!mealSlotId || !participantId) return NextResponse.json({ error: "mealSlotId and participantId required" }, { status: 400 });

    const body = await req.json();
    const parsed = UpsertSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    await prisma.assignment.upsert({
        where: { mealSlotId_participantId: { mealSlotId, participantId } },
        update: { role: parsed.data.role },
        create: { mealSlotId, participantId, role: parsed.data.role },
    });
    return NextResponse.json({ ok: true });
}
