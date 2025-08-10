import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Assign a recipe to a meal slot (idempotent)
export async function PUT(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/meals\/([^/]+)\/recipes\/([^/]+)/);
    const mealSlotId = match?.[1];
    const recipeId = match?.[2];
    if (!mealSlotId || !recipeId) return NextResponse.json({ error: "mealSlotId and recipeId required" }, { status: 400 });

    // Validate both exist and belong to same trip
    const [mealSlot, recipe] = await Promise.all([
        prisma.mealSlot.findUnique({ where: { id: mealSlotId }, select: { id: true, tripId: true } }),
        prisma.recipe.findUnique({ where: { id: recipeId }, select: { id: true, tripId: true } }),
    ]);
    if (!mealSlot) return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    if (mealSlot.tripId !== recipe.tripId) return NextResponse.json({ error: "Recipe and meal belong to different trips" }, { status: 400 });

    await prisma.recipeAssignment.upsert({
        where: { mealSlotId_recipeId: { mealSlotId, recipeId } },
        update: {},
        create: { mealSlotId, recipeId },
    });

    return NextResponse.json({ ok: true });
}

// Unassign a recipe from a meal slot
export async function DELETE(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/meals\/([^/]+)\/recipes\/([^/]+)/);
    const mealSlotId = match?.[1];
    const recipeId = match?.[2];
    if (!mealSlotId || !recipeId) return NextResponse.json({ error: "mealSlotId and recipeId required" }, { status: 400 });

    await prisma.recipeAssignment.deleteMany({ where: { mealSlotId, recipeId } });
    return NextResponse.json({ ok: true });
}
