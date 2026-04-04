import { NextRequest, NextResponse } from "next/server";
import { getDb as getAppDb } from "@/lib/db";
import { randomUUID } from "crypto";
import Database from 'better-sqlite3';
import path from 'path';

const WORDS_DB_PATH = path.join(process.cwd(), 'src', 'data', 'oxford3000.db');

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, wordsText } = body;
        
        if (!name || !wordsText) {
            return NextResponse.json({ error: "Name and wordsText are required" }, { status: 400 });
        }

        const appDb = getAppDb();
        const wordsDb = new Database(WORDS_DB_PATH);
        
        const lines = wordsText.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
        
        const now = new Date().toISOString();
        const collectionId = randomUUID();

        // 1. Create collection in appDb
        appDb.prepare(`
            INSERT INTO collections (id, name, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(collectionId, name, 'Hızlı kelime grubu', now, now);

        // Önbelleğe alınmış SQLite sorguları (performans için)
        const checkWordStmt = wordsDb.prepare('SELECT id FROM words WHERE LOWER(word) = ?');
        const insertWordStmt = wordsDb.prepare('INSERT INTO words (word, class, level, tr_mean) VALUES (?, ?, ?, ?)');
        const checkColStmt = appDb.prepare('SELECT 1 FROM collection_words WHERE collection_id = ? AND word_id = ?');
        const insertColStmt = appDb.prepare('INSERT INTO collection_words (collection_id, word_id) VALUES (?, ?)');

        // İki veritabanını da korumak ve hızlı yazmak için iç içe transaction kullanıyoruz
        const processAll = appDb.transaction(() => {
            wordsDb.transaction(() => {
                for (const line of lines) {
                    let english = line;
                    let turkish = "";
                    
                    if (line.includes("=")) {
                        const parts = line.split("=");
                        english = parts[0].trim();
                        turkish = parts.slice(1).join("=").trim();
                    } else if (line.includes("-")) {
                        const parts = line.split("-");
                        english = parts[0].trim();
                        turkish = parts.slice(1).join("-").trim();
                    }
                    
                    english = english.toLowerCase();
                    if (!english) continue;

                    let wordId: string | number | bigint;

                    const existing = checkWordStmt.get(english) as { id: string | number } | undefined;
                    
                    if (existing) {
                        wordId = existing.id;
                    } else {
                        const insertResult = insertWordStmt.run(english, 'other', 'a1', turkish || 'na');
                        wordId = insertResult.lastInsertRowid;
                    }

                    const alreadyInCol = checkColStmt.get(collectionId, String(wordId));
                    if (!alreadyInCol) {
                        insertColStmt.run(collectionId, String(wordId));
                    }
                }
            })();
        });

        processAll();

        wordsDb.close();

        return NextResponse.json({ success: true, collectionId });
    } catch (err) {
        console.error("POST /api/collections/quick-create error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
