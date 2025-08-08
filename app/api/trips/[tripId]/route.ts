import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/trips\/([^/]+)/);
    const tripId = match?.[1];
    if (!tripId) return NextResponse.json({ error: "tripId missing in path" }, { status: 400 });

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(trip);
}
