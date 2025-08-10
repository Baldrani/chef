import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { parseDateOnlyToUtcNoon } from "@/lib/dates";
import type { MealType } from "@prisma/client";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/meals\/([^/]+)/);
    const mealSlotId = match?.[1];
    if (!mealSlotId) return NextResponse.json({ error: "mealSlotId missing in path" }, { status: 400 });

    const meal = await prisma.mealSlot.findUnique({
        where: { id: mealSlotId },
        include: {
            assignments: { include: { participant: true } },
            recipes: { include: { recipe: true } },
        },
    });

    if (!meal) return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    return NextResponse.json(meal);
}

const PatchSchema = z
    .object({
        date: z.string().date().optional(),
        mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER"]).optional(),
    })
    .refine(v => v.date !== undefined || v.mealType !== undefined, {
        message: "Provide at least one of 'date' or 'mealType'",
    });

export async function PATCH(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/meals\/([^/]+)/);
    const mealSlotId = match?.[1];
    if (!mealSlotId) return NextResponse.json({ error: "mealSlotId missing in path" }, { status: 400 });

    const json = await req.json();
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const data: { date?: Date; mealType?: MealType } = {};
    if (parsed.data.date) data.date = parseDateOnlyToUtcNoon(parsed.data.date);
    if (parsed.data.mealType) data.mealType = parsed.data.mealType as MealType;

    try {
        const updated = await prisma.mealSlot.update({ where: { id: mealSlotId }, data });
        return NextResponse.json(updated);
    } catch (e: unknown) {
        const err = e as { code?: string };
        if (err?.code === "P2002") {
            return NextResponse.json({ error: "A meal already exists for that date and type" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to update meal" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/meals\/([^/]+)/);
    const mealSlotId = match?.[1];
    if (!mealSlotId) return NextResponse.json({ error: "mealSlotId missing in path" }, { status: 400 });

    await prisma.$transaction(async tx => {
        await tx.assignment.deleteMany({ where: { mealSlotId } });
        await tx.recipeAssignment.deleteMany({ where: { mealSlotId } });
        await tx.mealSlot.delete({ where: { id: mealSlotId } });
    });

    return NextResponse.json({ ok: true });
}
