import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/trips\/([^/]+)\/schedule/);
    const tripId = match?.[1];
    if (!tripId) return NextResponse.json({ error: "tripId missing in path" }, { status: 400 });

    const slots = await prisma.mealSlot.findMany({
        where: { tripId },
        include: {
            assignments: { include: { participant: true } },
            recipes: { include: { recipe: true } },
        },
        orderBy: [{ date: "asc" }, { mealType: "asc" }],
    });

    return NextResponse.json(slots);
}
