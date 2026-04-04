import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'oxford3000.db');

function getDb() {
    return new Database(DB_PATH);
}

// oxford3000.db satırını app beklediği formata çevir
function mapRow(row: { id: number; word: string; class: string; level: string; tr_mean: string }) {
    return {
        id: String(row.id),
        english: row.word,
        turkish: row.tr_mean && row.tr_mean !== 'na' ? row.tr_mean : '',
        level: row.level.toUpperCase(), // "a1" → "A1"
        class: row.class,
        example: '',
        tags: [],
    };
}

// GET /api/words  → tüm kelimeleri döndür
export async function GET() {
    try {
        const db = getDb();
        const rows = db.prepare('SELECT * FROM words ORDER BY level, word').all() as Parameters<typeof mapRow>[0][];
        db.close();
        return NextResponse.json(rows.map(mapRow));
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'DB read failed' }, { status: 500 });
    }
}

// POST /api/words  → yeni kelime ekle
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Eski uyumluluk: tüm kelime listesi gönderilmişse (admin bulk save) yoksay
        if (Array.isArray(body)) {
            return NextResponse.json({ success: true, message: 'Bulk save not supported with DB. Use individual add/edit.' });
        }

        const { english, turkish, level, example } = body as {
            english: string; turkish: string; level: string; example?: string;
        };

        if (!english || !level) {
            return NextResponse.json({ error: 'english and level are required' }, { status: 400 });
        }

        const db = getDb();
        const result = db.prepare(
            'INSERT INTO words (word, class, level, tr_mean) VALUES (?, ?, ?, ?)'
        ).run(english.trim(), 'other', level.toLowerCase(), turkish || '');
        db.close();

        return NextResponse.json({
            success: true,
            id: String(result.lastInsertRowid),
            english,
            turkish,
            level: level.toUpperCase(),
            example: example || '',
            tags: [],
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'DB write failed' }, { status: 500 });
    }
}
