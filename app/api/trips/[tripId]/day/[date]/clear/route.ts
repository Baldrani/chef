import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseDateOnlyToUtcNoon } from "@/lib/dates";

export async function DELETE(_req: NextRequest, { params }: { params: { tripId: string; date: string } }) {
    const { tripId } = params;
    const dateParam = decodeURIComponent(params.date);
    if (!tripId || !dateParam) {
        return NextResponse.json({ error: "tripId and date are required" }, { status: 400 });
    }

    const day = parseDateOnlyToUtcNoon(dateParam);

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


