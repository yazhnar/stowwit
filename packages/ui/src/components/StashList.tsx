import type { IndexedStash } from '../types';

interface StashListProps {
  stashes: IndexedStash[];
  activeHash: string | null;
  onSelect: (stash: IndexedStash) => void;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

/**
 * Left pane. Flat rows with hairline dividers and a left accent bar on the
 * active row — deliberately not the rounded-card-with-shadow default, since
 * this list is scanned quickly and density matters more than ornament.
 */
export function StashList({ stashes, activeHash, onSelect }: StashListProps) {
  if (stashes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-ink-muted">No stashes indexed yet.</p>
        <p className="text-xs text-ink-faint">Run a sync to scan your repo's git stash list.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border-subtle overflow-y-auto">
      {stashes.map((stash) => {
        const isActive = stash.hash === activeHash;
        return (
          <li key={stash.stash_id}>
            <button
              onClick={() => onSelect(stash)}
              className={`block w-full border-l-2 px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'border-l-amber bg-base-overlay'
                  : 'border-l-transparent hover:bg-base-elevated'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate text-sm ${isActive ? 'text-amber' : 'text-ink'}`}>
                  {stash.intent_tag || stash.message}
                </span>
                <span className="shrink-0 font-mono text-xs text-ink-faint">
                  {relativeTime(stash.timestamp)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-xs text-ink-muted">{stash.branch}</span>
                <span className="font-mono text-xs text-ink-faint">{stash.stash_id}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
