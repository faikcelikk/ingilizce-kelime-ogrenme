import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { level = "A2" } = await req.json();
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "OpenRouter API key is not configured" }, { status: 500 });
        }

        const systemPrompt = `You are an English language learning assistant. Generate fill-in-the-blank exercises for ${level} level learners.

Rules:
- The sentence must be appropriate for ${level} CEFR level
- Choose ONE target word that fits the level (for ${level}: ${getLevelGuide(level)})
- The target word must be a real, common English word
- Return ONLY valid JSON, nothing else
- JSON format: { "sentence": "She went to the ___ to buy some food.", "answer": "market", "turkish": "Pazar yeri / dükkan", "hint": "a place where you buy things", "difficulty": "${level}" }
- The blank is shown as ___
- "turkish" field: the Turkish meaning(s) of the answer word
- "hint" field: a SHORT English definition clue (max 8 words)
- Make sentences natural and contextually interesting`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
                "X-Title": "Ingilizce Kelime Ogrenme - Sentence Mode",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Generate a new ${level} level fill-in-the-blank sentence. Return only JSON.` }
                ],
                temperature: 0.9,
                max_tokens: 200,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error?.message || "AI error" }, { status: response.status });
        }

        const content = data.choices?.[0]?.message?.content || "";

        // JSON'u raw string'dan parse et
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);

    } catch (error) {
        console.error("Sentence Route Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

function getLevelGuide(level: string): string {
    const guides: Record<string, string> = {
        A1: "very basic words: go, eat, big, red, house, day, good",
        A2: "simple everyday words: travel, weather, family, shopping, job",
        B1: "intermediate words: opinion, experience, describe, compare, suggest",
        B2: "upper-intermediate: complex, significant, demonstrate, whereas, advantage",
        C1: "advanced: sophisticated, contemporary, resilient, nuanced, elaborate",
        C2: "near-native: esoteric, ephemeral, juxtapose, ubiquitous, paradigm",
    };
    return guides[level] || guides["A2"];
}
