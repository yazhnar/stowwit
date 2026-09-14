import { useEffect, useState, useCallback } from 'react';
import { SearchBar } from './components/SearchBar';
import { StashList } from './components/StashList';
import { DiffViewer } from './components/DiffViewer';
import { fetchStashes, searchStashes, triggerSync } from './api/client';
import type { IndexedStash } from './types';

export default function App() {
  const [stashes, setStashes] = useState<IndexedStash[]>([]);
  const [query, setQuery] = useState('');
  const [activeHash, setActiveHash] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    try {
      const results = q.trim() ? await searchStashes(q) : await fetchStashes();
      setStashes(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    load(query);
  }, [query, load]);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      await triggerSync();
      await load(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncing(false);
    }
  }

  const activeStash = stashes.find((s) => s.hash === activeHash) ?? stashes[0] ?? null;

  return (
    <div className="flex h-screen flex-col">
      <SearchBar
        value={query}
        onChange={setQuery}
        onSync={handleSync}
        syncing={syncing}
        resultCount={stashes.length}
      />

      {error && (
        <div className="border-b border-border bg-diff-remove px-4 py-2 text-sm text-diff-removeText">
          {error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[360px] shrink-0 overflow-hidden border-r border-border">
          <StashList
            stashes={stashes}
            activeHash={activeStash?.hash ?? null}
            onSelect={(stash) => setActiveHash(stash.hash)}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <DiffViewer stash={activeStash} />
        </div>
      </div>

      <footer className="flex items-center gap-4 border-t border-border bg-base-elevated px-4 py-1.5 text-xs text-ink-faint">
        <span><kbd className="font-mono">/</kbd> search</span>
        <span>Local engine · localhost:3000</span>
      </footer>
    </div>
  );
}
