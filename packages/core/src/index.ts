import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { listStashes, getStashDiff, assertGitRepo } from './gitService.js';
import { getAllStashes, upsertStash, searchStashes, pruneMissing, getStashByHash } from './db.js';
import { getAIProvider } from './aiService.js';
import type { IndexedStash } from './types.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

/** GET /api/stashes — everything currently in the local index. */
app.get('/api/stashes', (_req, res) => {
  try {
    res.json({ stashes: getAllStashes() });
  } catch (err) {
    res.status(500).json({ error: toMessage(err) });
  }
});

/**
 * POST /api/sync — scans `git stash list`, diffs anything not already indexed,
 * asks the configured AI provider for a summary, and persists it to SQLite.
 * Also prunes index entries for stashes that were popped/dropped since the last sync.
 */
app.post('/api/sync', async (_req, res) => {
  try {
    await assertGitRepo();

    const rawStashes = await listStashes();
    pruneMissing(rawStashes.map((s) => s.hash));

    const provider = getAIProvider();
    const results: IndexedStash[] = [];

    for (const raw of rawStashes) {
      const existing = getStashByHash(raw.hash);

      // Skip re-summarizing stashes we've already indexed — diffs for existing
      // stash entries don't change, so this keeps sync fast and cheap.
      if (existing) {
        results.push(existing);
        continue;
      }

      const diff = await getStashDiff(raw.ref);
      const { intent_tag, content_summary } = await provider.summarize({
        message: raw.message,
        branch: raw.branch,
        diff
      });

      const indexed: IndexedStash = {
        stash_id: raw.ref,
        hash: raw.hash,
        message: raw.message,
        branch: raw.branch,
        content_summary,
        intent_tag,
        diff,
        timestamp: new Date().toISOString()
      };

      upsertStash(indexed);
      results.push(indexed);
    }

    res.json({ synced: results.length, stashes: results });
  } catch (err) {
    res.status(500).json({ error: toMessage(err) });
  }
});

/** GET /api/search?q= — local keyword search over indexed summaries/messages/branches. */
app.get('/api/search', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  if (!q.trim()) {
    return res.json({ stashes: getAllStashes() });
  }
  try {
    res.json({ stashes: searchStashes(q) });
  } catch (err) {
    res.status(500).json({ error: toMessage(err) });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, provider: process.env.LLM_PROVIDER || 'ollama' });
});

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

app.listen(PORT, () => {
  console.log(`stowwit core listening on http://localhost:${PORT}`);
  console.log(`AI provider: ${process.env.LLM_PROVIDER || 'ollama'}`);
});
