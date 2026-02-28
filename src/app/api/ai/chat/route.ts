import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { messages, model = "openai/gpt-3.5-turbo" } = await req.json();
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "OpenRouter API key is not configured" },
                { status: 500 }
            );
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
                "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "Ingilizce Kelime Ogrenme",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error?.message || "OpenRouter API error" },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("AI Route Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
