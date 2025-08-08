import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const CreateTripSchema = z.object({
    name: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
});

export async function POST(req: NextRequest) {
    const body = await req.json();
    const parsed = CreateTripSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    const { name, startDate, endDate } = parsed.data;
    const trip = await prisma.trip.create({ data: { name, startDate: new Date(startDate), endDate: new Date(endDate) } });
    return NextResponse.json(trip);
}

export async function GET() {
    const trips = await prisma.trip.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(trips);
}
