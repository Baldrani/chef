import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import OpenAI from "openai";
import { parseDateOnlyToUtcNoon } from "@/lib/dates";

const Schema = z.object({
    tripId: z.string().min(1),
    date: z.string().date(),
    servingsMultiplier: z.number().min(0.25).max(4).optional(),
    autoCalculateServings: z.boolean().optional(),
    language: z.enum(["en", "fr"]).optional(),
});

type GroceryList = {
    items: Array<{ name: string; quantity?: string; category?: string }>;
};



const systemPrompts = {
    en: `You are a meticulous chef. Given recipe titles and optional notes for a specific day, output a concise grocery list as strict JSON with shape {"items":[{"name":"string","quantity":"string?","category":"string?"}...]}. Merge duplicates, use common names, infer quantities, prefer metric (g, kg, L), and keep it minimal.`,
    fr: `Vous êtes un chef méticuleux. À partir des titres de recettes et des notes optionnelles pour un jour spécifique, générez une liste d'épicerie concise au format JSON strict avec la forme {"items":[{"name":"string","quantity":"string?","category":"string?"}...]}. Fusionnez les doublons, utilisez des noms courants, inférez les quantités, préférez le métrique (g, kg, L), et restez minimal. Répondez en français.`
};

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const tripId = url.searchParams.get('tripId');
    const date = url.searchParams.get('date');

    if (!tripId || !date) {
        return NextResponse.json({ error: 'tripId and date are required' }, { status: 400 });
    }

    const day = parseDateOnlyToUtcNoon(date);

    const groceryList = await prisma.groceryList.findUnique({
        where: { tripId_date: { tripId, date: day } },
        include: { items: true }
    });

    if (!groceryList) {
        return NextResponse.json({ items: [] });
    }

    // Get meal information for the summary
    const slots = await prisma.mealSlot.findMany({
        where: { tripId, date: day },
        include: { recipes: { include: { recipe: true } } },
    });

    // Count available participants for this date
    const availableParticipants = await prisma.participant.findMany({
        where: {
            tripId,
            OR: [
                { availabilities: { none: {} } },
                { availabilities: { some: { date: day } } }
            ]
        }
    });

    const summary = {
        participantCount: availableParticipants.length,
        meals: slots.map(slot => ({
            mealType: slot.mealType,
            recipes: slot.recipes.map(ra => ({
                title: ra.recipe.title,
                serves: ra.recipe.serves
            }))
        })),
        servingsMultiplier: groceryList.servingsMultiplier
    };

    return NextResponse.json({
        items: groceryList.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            category: item.category,
            isChecked: item.isChecked
        })),
        summary
    });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const { tripId, date, servingsMultiplier = 1, autoCalculateServings = false, language = "en" } = parsed.data;
    const day = parseDateOnlyToUtcNoon(date);

    const slots = await prisma.mealSlot.findMany({
        where: { tripId, date: day },
        include: { recipes: { include: { recipe: true } } },
    });

    const recipes = slots.flatMap(s => s.recipes.map(ra => ra.recipe));

    if (recipes.length === 0) return NextResponse.json({ items: [] });

    // Count participants available on this date (needed for both auto-calculation and summary)
    const availableParticipants = await prisma.participant.findMany({
        where: {
            tripId,
            OR: [
                // Participants with no availability records (assumed available)
                { availabilities: { none: {} } },
                // Participants with availability record for this date
                { availabilities: { some: { date: day } } }
            ]
        }
    });

    let finalServingsMultiplier = servingsMultiplier;

    if (autoCalculateServings) {
        const participantCount = availableParticipants.length;

        console.log("participantCount", participantCount);

        if (participantCount > 0) {
            // Calculate average servings per recipe
            const recipesWithServings = recipes.filter(r => r.serves);
            const avgServings = recipesWithServings.length > 0 
                ? recipesWithServings.reduce((sum, r) => sum + (r.serves || 0), 0) / recipesWithServings.length
                : 4; // Default assumption if no serving info

            finalServingsMultiplier = participantCount / avgServings;
        }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const userContent =
        `Servings multiplier: ${finalServingsMultiplier}. Recipes:\n` +
        recipes.map(r => `- ${r.title}${r.serves ? ` (serves ${r.serves})` : ""}${r.notes ? `\n  Notes: ${r.notes}` : ""}`).join("\n");

    console.log("userContent", userContent);

    let chat: OpenAI.Chat.Completions.ChatCompletion;
    try {
        chat = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompts[language] },
            { role: "user", content: userContent },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
    });
    } catch (error) {
        console.error("Error generating groceries", error);
        return NextResponse.json({ error: "Error generating groceries" }, { status: 500 });
    }

    const message = chat.choices[0]?.message?.content;
    console.log(message);

    let parsedJson: GroceryList = { items: [] };
    try {
        parsedJson = JSON.parse(message || '{"items":[]}');
    } catch {
        parsedJson = { items: [] };
    }

    // Save or update the grocery list in the database
    const groceryList = await prisma.groceryList.upsert({
        where: { tripId_date: { tripId, date: day } },
        update: {
            servingsMultiplier: finalServingsMultiplier,
            autoCalculateServings,
            updatedAt: new Date(),
            items: {
                deleteMany: {}, // Remove existing items
                create: parsedJson.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    category: item.category
                }))
            }
        },
        create: {
            tripId,
            date: day,
            servingsMultiplier: finalServingsMultiplier,
            autoCalculateServings,
            items: {
                create: parsedJson.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    category: item.category
                }))
            }
        },
        include: { items: true }
    });

    // Create summary information
    const summary = {
        participantCount: availableParticipants.length,
        meals: slots.map(slot => ({
            mealType: slot.mealType,
            recipes: slot.recipes.map(ra => ({
                title: ra.recipe.title,
                serves: ra.recipe.serves
            }))
        })),
        servingsMultiplier: finalServingsMultiplier
    };

    return NextResponse.json({
        items: groceryList.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            category: item.category,
            isChecked: item.isChecked
        })),
        summary
    });
}
