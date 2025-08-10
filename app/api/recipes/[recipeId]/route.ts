import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const PatchRecipeSchema = z
    .object({
        title: z.string().min(1).optional(),
        notes: z.string().nullable().optional(),
    })
    .refine(v => v.title !== undefined || v.notes !== undefined, {
        message: "Provide at least one of 'title' or 'notes'",
    });

export async function PATCH(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/recipes\/([^/]+)/);
    const recipeId = match?.[1];
    if (!recipeId) return NextResponse.json({ error: "recipeId missing in path" }, { status: 400 });

    const json = await req.json();
    const parsed = PatchRecipeSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const data: { title?: string; notes?: string | null } = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

    const updated = await prisma.recipe.update({ where: { id: recipeId }, data });
    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/recipes\/([^/]+)/);
    const recipeId = match?.[1];
    if (!recipeId) return NextResponse.json({ error: "recipeId missing in path" }, { status: 400 });

    // Delete recipe assignments first, then the recipe
    await prisma.$transaction(async (tx) => {
        await tx.recipeAssignment.deleteMany({ where: { recipeId } });
        await tx.recipe.delete({ where: { id: recipeId } });
    });

    return NextResponse.json({ ok: true });
}
