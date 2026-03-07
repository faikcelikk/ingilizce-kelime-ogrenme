import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

interface OxfordWord {
    id: number;
    word: string;
    class: string;
    level: string;
    tr_mean: string;
}

// Oxford 3000 DB'den seviyeye uygun, daha önce kullanılmamış rastgele kelime seç
function pickWordFromDB(
    level: string,
    usedWords: string[]
): { word: string; turkish: string; wordClass: string } | null {
    try {
        const dbPath = path.join(process.cwd(), "src", "data", "oxford3000.db");
        const db = new Database(dbPath, { readonly: true });

        const used = new Set(usedWords.map(w => w.toLowerCase()));
        const dbLevel = level.toLowerCase(); // "a1", "a2", "b1" ...

        // Anlamsız/çok kısa/özel kelime sınıflarını dışla
        const rows = db.prepare(`
            SELECT word, class, tr_mean
            FROM words
            WHERE level = ?
              AND length(word) >= 3
              AND class NOT IN ('indefinite article', 'definite article', 'number', 'ordinal number', 'auxiliary verb', 'modal verb', 'pronoun', 'preposition', 'conjunction', 'exclamation', 'infinitive marker')
            ORDER BY RANDOM()
            LIMIT 50
        `).all(dbLevel) as OxfordWord[];

        db.close();

        // Daha önce kullanılmamış ilk kelimeyi seç
        const candidate = rows.find(r => !used.has(r.word.toLowerCase()));
        if (!candidate) return null;

        return {
            word: candidate.word,
            turkish: candidate.tr_mean && candidate.tr_mean !== "na" ? candidate.tr_mean : "",
            wordClass: candidate.class,
        };
    } catch (err) {
        console.error("DB read error:", err);
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const { level = "A2", usedWords = [] } = await req.json();
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "OpenRouter API key is not configured" }, { status: 500 });
        }

        // Oxford 3000'den kelime çek
        const picked = pickWordFromDB(level, usedWords);

        let forcedWordClause = "";
        let forcedTurkish = "";

        if (picked) {
            forcedWordClause = `\n- The answer word MUST be exactly: "${picked.word}" (word class: ${picked.wordClass}). Build the sentence around this specific word.`;
            forcedTurkish = picked.turkish;
        } else {
            // DB'de uygun kelime bulunamadı — AI'ın kendi kelimesini kullanmasına izin verme
            return NextResponse.json({ error: "no_words_available" }, { status: 404 });
        }

        const systemPrompt = `You are an English language learning assistant. Generate fill-in-the-blank exercises for ${level} level learners.

Rules:
- The sentence must be appropriate for ${level} CEFR level
- The target word must be a real, common English word
- Return ONLY valid JSON, nothing else
- JSON format: { "sentence": "She went to the ___ to buy some food.", "answer": "market", "turkish": "Pazar yeri / dükkan", "hint": "a place where you buy things", "difficulty": "${level}" }
- The blank is shown as ___
- "turkish" field: the Turkish meaning(s) of the answer word
- "hint" field: a SHORT English definition clue (max 8 words)
- Make sentences natural and contextually interesting${forcedWordClause}`;

        const userMessage = picked
            ? `Generate a fill-in-the-blank sentence where the missing word is exactly "${picked.word}". The sentence should fit ${level} level. Return only JSON.`
            : `Generate a new UNIQUE ${level} level fill-in-the-blank sentence. Return only JSON.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
                "X-Title": "Ingilizce Kelime Ogrenme - Sentence Mode",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "arcee-ai/trinity-large-preview:free",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
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

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Oxford DB'deki Türkçeyi kullan (varsa)
        if (picked && forcedTurkish) {
            parsed.turkish = forcedTurkish;
        }

        return NextResponse.json(parsed);

    } catch (error) {
        console.error("Sentence Route Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
