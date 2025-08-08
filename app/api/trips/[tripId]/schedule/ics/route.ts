import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

const MEAL_TIME_UTC: Record<string, number> = {
    BREAKFAST: 8, // 08:00Z
    LUNCH: 12, // 12:00Z
    DINNER: 19, // 19:00Z
};

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
        const cooks = s.assignments.map(a => a.participant.name).join(", ");
        const recipeTitles = s.recipes.map(r => r.recipe.title).join(", ");

        const start = new Date(s.date);
        // Set time component based on meal type (UTC hour)
        start.setUTCHours(MEAL_TIME_UTC[s.mealType] ?? 12, 0, 0, 0);
        const end = addHours(start, 1.5);

        const uid = `${s.id}@chef`;

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${dtstamp}`);
        lines.push(`DTSTART:${formatDateICS(start)}`);
        lines.push(`DTEND:${formatDateICS(end)}`);
        lines.push(`SUMMARY:${s.mealType} – ${trip.name}`);
        const desc = [`Cooks: ${cooks || "TBD"}`, recipeTitles ? `Recipes: ${recipeTitles}` : null].filter(Boolean).join("\\n");
        lines.push(`DESCRIPTION:${desc}`);
        lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");
    const ics = lines.join("\r\n");

    return new NextResponse(ics, {
        status: 200,
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename=trip-${tripId}-schedule.ics`,
        },
    });
}
