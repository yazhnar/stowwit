import { useEffect, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSync: () => void;
  syncing: boolean;
  resultCount: number;
}

/**
 * Pinned command-bar style search, deliberately terse — this is a tool people
 * reach for mid-flow, not a landing page. "/" focuses it from anywhere.
 */
export function SearchBar({ value, onChange, onSync, syncing, resultCount }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isTyping = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex items-center gap-3 border-b border-border bg-base-elevated px-4 py-3">
      <span className="font-mono text-sm text-ink-faint">sto(W)it</span>
      <div className="flex flex-1 items-center gap-2 rounded-sm border border-border bg-base px-3 py-1.5">
        <span className="text-ink-faint">⌕</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search stashes by intent, branch, or message…"
          className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
        />
        <kbd className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs text-ink-faint">/</kbd>
      </div>
      <span className="whitespace-nowrap text-xs text-ink-muted">
        {resultCount} stash{resultCount === 1 ? '' : 'es'}
      </span>
      <button
        onClick={onSync}
        disabled={syncing}
        className="whitespace-nowrap rounded-sm border border-border px-3 py-1.5 text-xs text-ink transition-colors hover:border-amber-dim hover:text-amber disabled:cursor-not-allowed disabled:opacity-50"
      >
        {syncing ? 'Syncing…' : 'Sync stashes'}
      </button>
    </div>
  );
}
