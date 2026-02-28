import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// DB dosyası proje kökünde data/ klasöründe tutulur
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "app.db");

// data/ klasörü yoksa oluştur
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (!_db) {
        _db = new Database(DB_PATH);
        _db.pragma("journal_mode = WAL");
        _db.pragma("foreign_keys = ON");
        initSchema(_db);
    }
    return _db;
}

function initSchema(db: Database.Database) {
    db.exec(`
        -- Kelime koleksiyonları
        CREATE TABLE IF NOT EXISTS collections (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT,
            created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );

        -- Koleksiyon ↔ Kelime ilişkisi
        CREATE TABLE IF NOT EXISTS collection_words (
            collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
            word_id       TEXT NOT NULL,
            PRIMARY KEY (collection_id, word_id)
        );

        -- Kelime bazlı ilerleme (SM-2)
        CREATE TABLE IF NOT EXISTS word_progress (
            word_id         TEXT PRIMARY KEY,
            wrong_count     INTEGER NOT NULL DEFAULT 0,
            skipped_count   INTEGER NOT NULL DEFAULT 0,
            correct_streak  INTEGER NOT NULL DEFAULT 0,
            last_answer     TEXT,
            last_seen_at    TEXT,
            next_review_at  TEXT,
            ease_factor     REAL NOT NULL DEFAULT 2.5,
            interval_days   INTEGER NOT NULL DEFAULT 0,
            repetitions     INTEGER NOT NULL DEFAULT 0
        );

        -- Genel kullanıcı istatistikleri (tek satır, id=1)
        CREATE TABLE IF NOT EXISTS stats (
            id              INTEGER PRIMARY KEY DEFAULT 1,
            total_questions INTEGER NOT NULL DEFAULT 0,
            correct_count   INTEGER NOT NULL DEFAULT 0,
            wrong_count     INTEGER NOT NULL DEFAULT 0,
            skipped_count   INTEGER NOT NULL DEFAULT 0,
            level_stats     TEXT NOT NULL DEFAULT '{}',
            daily_goal      TEXT NOT NULL DEFAULT '{}',
            streak          TEXT NOT NULL DEFAULT '{}'
        );
    `);
}
