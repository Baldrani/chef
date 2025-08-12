import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const UpdateSchema = z.object({
    isChecked: z.boolean().optional(),
    name: z.string().optional(),
    quantity: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { itemId: string } }) {
    const { itemId } = params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    try {
        const updatedItem = await prisma.groceryItem.update({
            where: { id: itemId },
            data: parsed.data
        });

        return NextResponse.json({
            name: updatedItem.name,
            quantity: updatedItem.quantity,
            category: updatedItem.category,
            isChecked: updatedItem.isChecked
        });
    } catch (error) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { itemId: string } }) {
    const { itemId } = params;

    try {
        await prisma.groceryItem.delete({
            where: { id: itemId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
}