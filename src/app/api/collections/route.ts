import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

// GET /api/collections — tüm koleksiyonları getir
export async function GET() {
    try {
        const db = getDb();
        const collections = db.prepare(`
            SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
                   GROUP_CONCAT(cw.word_id) as word_ids
            FROM collections c
            LEFT JOIN collection_words cw ON cw.collection_id = c.id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `).all() as {
            id: string; name: string; description: string | null;
            created_at: string; updated_at: string; word_ids: string | null;
        }[];

        const result = collections.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            wordIds: c.word_ids ? c.word_ids.split(",") : [],
            createdAt: c.created_at,
            updatedAt: c.updated_at,
        }));

        return NextResponse.json(result);
    } catch (err) {
        console.error("GET /api/collections error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/collections — yeni koleksiyon oluştur ya da güncelle
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const db = getDb();
        const id = body.id || randomUUID();
        const now = new Date().toISOString();

        const upsert = db.prepare(`
            INSERT INTO collections (id, name, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                description = excluded.description,
                updated_at = excluded.updated_at
        `);
        upsert.run(id, body.name, body.description ?? null, body.createdAt ?? now, now);

        return NextResponse.json({ id });
    } catch (err) {
        console.error("POST /api/collections error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
