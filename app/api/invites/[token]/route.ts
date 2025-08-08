import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const match = url.pathname.match(/\/api\/invites\/([^/]+)/);
    const token = match?.[1];
    if (!token) return NextResponse.json({ error: "token missing" }, { status: 400 });

    const invite = await prisma.invite.findUnique({
        where: { token },
        include: { trip: { select: { id: true, name: true, startDate: true, endDate: true } } },
    });
    if (!invite) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(invite);
}
