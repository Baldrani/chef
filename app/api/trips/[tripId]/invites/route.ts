import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/trips\/([^/]+)\/invites/);
    const tripId = match?.[1];
    if (!tripId) return NextResponse.json({ error: "tripId missing in path" }, { status: 400 });

    let invite = await prisma.invite.findFirst({ where: { tripId }, orderBy: { createdAt: "asc" } });
    if (!invite) {
        const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        invite = await prisma.invite.create({ data: { tripId, token } });
    }
    return NextResponse.json(invite);
}

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/trips\/([^/]+)\/invites/);
    const tripId = match?.[1];
    if (!tripId) return NextResponse.json({ error: "tripId missing in path" }, { status: 400 });

    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const invite = await prisma.invite.create({ data: { tripId, token } });
    return NextResponse.json(invite);
}
