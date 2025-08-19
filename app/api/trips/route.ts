import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getUserTrips } from "@/lib/auth-helpers";

const CreateTripSchema = z.object({
    name: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
});

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateTripSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    const { name, startDate, endDate } = parsed.data;
    const trip = await prisma.trip.create({ 
        data: { 
            name, 
            startDate: new Date(startDate), 
            endDate: new Date(endDate),
            createdBy: session.user.id
        } 
    });
    return NextResponse.json(trip);
}

export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { createdTrips, participatingTrips } = await getUserTrips(session.user.id);
    
    // Combine and deduplicate trips (in case user is both creator and participant)
    const allTrips = [...createdTrips];
    participatingTrips.forEach(trip => {
        if (!allTrips.find(t => t.id === trip.id)) {
            allTrips.push(trip);
        }
    });
    
    // Sort by creation date (most recent first)
    allTrips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json(allTrips);
}
