import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseDateOnlyToUtcNoon } from "@/lib/dates";

export async function DELETE(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/trips\/([^/]+)\/day\/([^/]+)\/clear/);
    const tripId = match?.[1];
    const dateParam = match?.[2] ? decodeURIComponent(match[2]) : undefined;
    if (!tripId || !dateParam) {
        return NextResponse.json({ error: "tripId and date are required" }, { status: 400 });
    }

    const day = parseDateOnlyToUtcNoon(dateParam!);

    try {
        await prisma.$transaction(async tx => {
            // Delete grocery items and list for this trip and date
            await tx.groceryItem.deleteMany({
                where: {
                    groceryList: { tripId, date: day },
                },
            });
            await tx.groceryList.deleteMany({ where: { tripId, date: day } });

            // Clear cook/helper assignments for this date
            await tx.assignment.deleteMany({
                where: {
                    mealSlot: { tripId, date: day },
                },
            });
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to clear day data", error);
        return NextResponse.json({ error: "Failed to clear day data" }, { status: 500 });
    }
}


