import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function generateETag(timestamp: Date, slotsCount: number): string {
    return `"${timestamp.getTime()}-${slotsCount}"`;
}

function formatDateICS(date: Date) {
    // YYYYMMDDTHHMMSSZ (UTC)
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = date.getUTCFullYear();
    const m = pad(date.getUTCMonth() + 1);
    const d = pad(date.getUTCDate());
    const hh = pad(date.getUTCHours());
    const mm = pad(date.getUTCMinutes());
    const ss = pad(date.getUTCSeconds());
    return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

function addHours(date: Date, hours: number) {
    return new Date(date.getTime() + hours * 3600 * 1000);
}

const DEFAULT_MEAL_TIME_UTC: Record<string, number> = {
    BREAKFAST: 8, // 08:00Z
    LUNCH: 12, // 12:00Z
    DINNER: 19, // 19:00Z
};

function parseTimeToUTCHour(timeString: string | null | undefined): number | null {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours + (minutes / 60);
}

function getDefaultTimeForMeal(trip: { defaultBreakfastTime?: string | null; defaultLunchTime?: string | null; defaultDinnerTime?: string | null }, mealType: string): number {
    const timeString = mealType === 'BREAKFAST' ? trip.defaultBreakfastTime
                     : mealType === 'LUNCH' ? trip.defaultLunchTime
                     : mealType === 'DINNER' ? trip.defaultDinnerTime
                     : null;
    
    const parsed = parseTimeToUTCHour(timeString);
    return parsed ?? DEFAULT_MEAL_TIME_UTC[mealType] ?? 12;
}

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/trips\/([^/]+)\/schedule\/ics/);
    const tripId = match?.[1];
    if (!tripId) return new NextResponse("tripId missing", { status: 400 });

    const [trip, slots] = await Promise.all([
        prisma.trip.findUnique({ where: { id: tripId } }),
        prisma.mealSlot.findMany({
            where: { tripId },
            include: {
                assignments: { include: { participant: true } },
                recipes: { include: { recipe: true } },
            },
            orderBy: [{ date: "asc" }, { mealType: "asc" }],
        }),
    ]);

    if (!trip) return new NextResponse("trip not found", { status: 404 });

    const lines: string[] = [];
    lines.push("BEGIN:VCALENDAR");
    lines.push("VERSION:2.0");
    lines.push(`PRODID:-//Chef//Trip Schedule//EN`);
    lines.push(`X-WR-CALNAME:${trip.name} Meals`);

    const now = new Date();
    const dtstamp = formatDateICS(now);

    for (const s of slots) {
        const cooks = s.assignments.filter(a => a.role === "COOK").map(a => a.participant.name).join(", ");
        const helpers = s.assignments.filter(a => a.role === "HELPER").map(a => a.participant.name).join(", ");
        const recipeTitles = s.recipes.map(r => r.recipe.title).join(", ");

        const start = new Date(s.date);
        // Use custom meal time if set, otherwise use trip defaults, fall back to global defaults
        const customTime = parseTimeToUTCHour(s.startTime);
        const defaultTime = getDefaultTimeForMeal(trip, s.mealType);
        const mealHour = customTime ?? defaultTime;
        
        const hours = Math.floor(mealHour);
        const minutes = Math.round((mealHour - hours) * 60);
        start.setUTCHours(hours, minutes, 0, 0);
        const end = addHours(start, 1.5);

        const uid = `${s.id}@chef`;

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${dtstamp}`);
        lines.push(`DTSTART:${formatDateICS(start)}`);
        lines.push(`DTEND:${formatDateICS(end)}`);
        lines.push(`SUMMARY:${s.mealType} – ${trip.name}`);
        
        // Enhanced description with cooks, helpers, and recipes
        const descParts = [
            cooks ? `Cooks: ${cooks}` : "Cooks: TBD",
            helpers ? `Helpers: ${helpers}` : null,
            recipeTitles ? `Recipes: ${recipeTitles}` : "Recipes: TBD"
        ].filter(Boolean);
        lines.push(`DESCRIPTION:${descParts.join("\\n")}`);

        // Add participants with emails as attendees
        const participantsWithEmails = s.assignments
            .map(a => a.participant)
            .filter(p => p.email && p.email.trim())
            .filter((p, index, arr) => arr.findIndex(x => x.email === p.email) === index); // Remove duplicates

        participantsWithEmails.forEach(participant => {
            lines.push(`ATTENDEE;CN=${participant.name};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:MAILTO:${participant.email}`);
        });

        // Add 1-hour reminder alarm
        lines.push("BEGIN:VALARM");
        lines.push("TRIGGER:-PT1H");
        lines.push("DESCRIPTION:Meal preparation reminder");
        lines.push("ACTION:DISPLAY");
        lines.push("END:VALARM");

        lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");
    const ics = lines.join("\r\n");
    
    const etag = generateETag(trip.createdAt, slots.length);

    return new NextResponse(ics, {
        status: 200,
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename=${encodeURIComponent(trip.name)}-schedule.ics`,
            "Cache-Control": "public, max-age=300", // 5 minutes cache
            "ETag": etag,
            "Last-Modified": trip.createdAt.toUTCString(),
        },
    });
}

// HEAD method for cache validation
export async function HEAD(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/trips\/([^/]+)\/schedule\/ics/);
    const tripId = match?.[1];
    if (!tripId) return new NextResponse(null, { status: 400 });

    const trip = await prisma.trip.findUnique({ 
        where: { id: tripId },
        select: { createdAt: true }
    });
    
    if (!trip) return new NextResponse(null, { status: 404 });
    
    const slotsCount = await prisma.mealSlot.count({ where: { tripId } });
    const etag = generateETag(trip.createdAt, slotsCount);
    
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            "ETag": etag,
            "Last-Modified": trip.createdAt.toUTCString(),
        },
    });
}
