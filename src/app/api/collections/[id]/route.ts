import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/collections/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const db = getDb();
        db.prepare("DELETE FROM collections WHERE id = ?").run(id);
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("DELETE /api/collections/[id] error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/collections/[id]/words — kelime ekle/çıkar
export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const { wordId, action } = await req.json(); // action: "add" | "remove"
        const db = getDb();

        if (action === "add") {
            db.prepare(`
                INSERT OR IGNORE INTO collection_words (collection_id, word_id)
                VALUES (?, ?)
            `).run(id, wordId);
        } else {
            db.prepare(`
                DELETE FROM collection_words WHERE collection_id = ? AND word_id = ?
            `).run(id, wordId);
        }

        // updatedAt güncelle
        db.prepare("UPDATE collections SET updated_at = ? WHERE id = ?")
            .run(new Date().toISOString(), id);

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("PATCH /api/collections/[id] error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
