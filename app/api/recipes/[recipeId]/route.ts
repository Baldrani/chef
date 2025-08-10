import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const PatchRecipeSchema = z
    .object({
        title: z.string().min(1).optional(),
        notes: z.string().nullable().optional(),
        serves: z.number().int().min(1).max(50).nullable().optional(),
    })
    .refine(v => v.title !== undefined || v.notes !== undefined || v.serves !== undefined, {
        message: "Provide at least one of 'title', 'notes', or 'serves'",
    });

export async function PATCH(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/recipes\/([^/]+)/);
    const recipeId = match?.[1];
    if (!recipeId) return NextResponse.json({ error: "recipeId missing in path" }, { status: 400 });

    const json = await req.json();
    const parsed = PatchRecipeSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const data: { title?: string; notes?: string | null; serves?: number | null } = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
    if (parsed.data.serves !== undefined) data.serves = parsed.data.serves;

    const updated = await prisma.recipe.update({ where: { id: recipeId }, data });
    return NextResponse.json(updated);
}
