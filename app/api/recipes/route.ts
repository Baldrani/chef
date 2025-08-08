import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const CreateRecipeSchema = z.object({
    tripId: z.string().min(1),
    title: z.string().min(1),
    notes: z.string().optional(),
    serves: z.number().int().min(1).max(50).optional(),
    mealSlotId: z.string().optional(),
});

export async function POST(req: NextRequest) {
    const body = await req.json();
    const parsed = CreateRecipeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const { tripId, title, notes, serves, mealSlotId } = parsed.data;

    const recipe = await prisma.recipe.create({ data: { tripId, title, notes, serves } });

    if (mealSlotId) {
        await prisma.recipeAssignment.create({ data: { mealSlotId, recipeId: recipe.id } });
    }

    return NextResponse.json(recipe);
}

export async function GET(req: NextRequest) {
    const tripId = new URL(req.url).searchParams.get("tripId");
    if (!tripId) return NextResponse.json({ error: "tripId required" }, { status: 400 });
    const recipes = await prisma.recipe.findMany({ where: { tripId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(recipes);
}
