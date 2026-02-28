import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Bu route hem GET edip kelimeleri okuyacak, hem de POST ile yeni listeyi yazacak.
const wordsFilePath = path.join(process.cwd(), 'src', 'data', 'words.json');

export async function GET() {
    try {
        const fileData = fs.readFileSync(wordsFilePath, 'utf8');
        const words = JSON.parse(fileData);
        return NextResponse.json(words);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read words.json' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const newWordsList = await request.json();
        fs.writeFileSync(wordsFilePath, JSON.stringify(newWordsList, null, 2), 'utf8');
        return NextResponse.json({ success: true, message: 'Words updated successfully!' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to write to words.json' }, { status: 500 });
    }
}
