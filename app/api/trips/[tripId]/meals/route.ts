import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { parseDateOnlyToUtcNoon } from "@/lib/dates";

const DayMealSchema = z.object({
    date: z.string().date(),
    mealTypes: z.array(z.enum(["BREAKFAST", "LUNCH", "DINNER"])).min(1),
});

const UpsertMealsSchema = z.object({
    days: z.array(DayMealSchema).min(1),
});

export async function POST(req: NextRequest) {
    const body = await req.json();
    const parsed = UpsertMealsSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/trips\/([^/]+)\/meals/);
    const tripId = match?.[1];
    if (!tripId) return NextResponse.json({ error: "tripId missing in path" }, { status: 400 });

    const { days } = parsed.data;

    await prisma.$transaction(async tx => {
        for (const d of days) {
            const dayDate = parseDateOnlyToUtcNoon(d.date);
            for (const mealType of d.mealTypes) {
                await tx.mealSlot.upsert({
                    where: { tripId_date_mealType: { tripId, date: dayDate, mealType } },
                    update: {},
                    create: { tripId, date: dayDate, mealType },
                });
            }
        }
    });

    const slots = await prisma.mealSlot.findMany({ where: { tripId }, orderBy: [{ date: "asc" }, { mealType: "asc" }] });
    return NextResponse.json(slots);
}
