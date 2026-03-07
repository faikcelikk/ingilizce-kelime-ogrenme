import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'oxford3000.db');

// PATCH /api/words/[id]  → kelime güncelle
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json() as { english?: string; turkish?: string; level?: string };

        const db = new Database(DB_PATH);
        const existing = db.prepare('SELECT * FROM words WHERE id = ?').get(Number(id));
        if (!existing) {
            db.close();
            return NextResponse.json({ error: 'Word not found' }, { status: 404 });
        }

        if (body.english) db.prepare('UPDATE words SET word = ? WHERE id = ?').run(body.english, Number(id));
        if (body.turkish !== undefined) db.prepare('UPDATE words SET tr_mean = ? WHERE id = ?').run(body.turkish, Number(id));
        if (body.level) db.prepare('UPDATE words SET level = ? WHERE id = ?').run(body.level.toLowerCase(), Number(id));

        db.close();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }
}

// DELETE /api/words/[id]  → kelime sil
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = new Database(DB_PATH);
        db.prepare('DELETE FROM words WHERE id = ?').run(Number(id));
        db.close();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'DB delete failed' }, { status: 500 });
    }
}
