import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { IndexedStash } from './types.js';

const DB_PATH = process.env.DB_PATH || './data/stowwit.db';

// Ensure the parent directory exists before better-sqlite3 tries to open the file.
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS stashes (
    stash_id        TEXT PRIMARY KEY,
    hash            TEXT NOT NULL,
    message         TEXT NOT NULL,
    branch          TEXT NOT NULL,
    content_summary TEXT NOT NULL DEFAULT '',
    intent_tag      TEXT NOT NULL DEFAULT '',
    diff            TEXT NOT NULL DEFAULT '',
    timestamp       TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_stashes_branch ON stashes(branch);
`);

export function getAllStashes(): IndexedStash[] {
  return db
    .prepare('SELECT * FROM stashes ORDER BY timestamp DESC')
    .all() as IndexedStash[];
}

export function getStashByHash(hash: string): IndexedStash | undefined {
  return db
    .prepare('SELECT * FROM stashes WHERE hash = ?')
    .get(hash) as IndexedStash | undefined;
}

export function upsertStash(stash: IndexedStash): void {
  db.prepare(
    `INSERT INTO stashes (stash_id, hash, message, branch, content_summary, intent_tag, diff, timestamp)
     VALUES (@stash_id, @hash, @message, @branch, @content_summary, @intent_tag, @diff, @timestamp)
     ON CONFLICT(stash_id) DO UPDATE SET
       hash = excluded.hash,
       message = excluded.message,
       branch = excluded.branch,
       content_summary = excluded.content_summary,
       intent_tag = excluded.intent_tag,
       diff = excluded.diff,
       timestamp = excluded.timestamp`
  ).run(stash);
}

/** Simple local keyword search across message, branch, tag, and summary. No external index needed. */
export function searchStashes(query: string): IndexedStash[] {
  const like = `%${query}%`;
  return db
    .prepare(
      `SELECT * FROM stashes
       WHERE message LIKE ? OR branch LIKE ? OR content_summary LIKE ? OR intent_tag LIKE ?
       ORDER BY timestamp DESC`
    )
    .all(like, like, like, like) as IndexedStash[];
}

/** Remove index entries for stashes that no longer exist in `git stash list` (e.g. popped/dropped). */
export function pruneMissing(existingHashes: string[]): void {
  const placeholders = existingHashes.map(() => '?').join(',');
  if (existingHashes.length === 0) {
    db.prepare('DELETE FROM stashes').run();
    return;
  }
  db.prepare(`DELETE FROM stashes WHERE hash NOT IN (${placeholders})`).run(
    ...existingHashes
  );
}
