import { useMemo } from 'react';
import type { IndexedStash } from '../types';

interface DiffViewerProps {
  stash: IndexedStash | null;
}

type LineKind = 'add' | 'remove' | 'meta' | 'context';

function classifyLine(line: string): LineKind {
  if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('@@')) {
    return 'meta';
  }
  if (line.startsWith('+')) return 'add';
  if (line.startsWith('-')) return 'remove';
  return 'context';
}

const LINE_STYLES: Record<LineKind, string> = {
  add: 'bg-diff-add text-diff-addText',
  remove: 'bg-diff-remove text-diff-removeText',
  meta: 'text-ink-faint',
  context: 'text-ink-muted'
};

/**
 * Right pane. Renders the raw unified diff directly rather than a two-file
 * comparison widget — the stash IS a diff, so this stays close to what `git
 * diff` actually produced instead of reconstructing it.
 */
export function DiffViewer({ stash }: DiffViewerProps) {
  const lines = useMemo(() => (stash ? stash.diff.split('\n') : []), [stash]);

  if (!stash) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-faint">
        Select a stash to view its diff
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-base-elevated px-4 py-3">
        <div>
          <p className="text-sm text-ink">{stash.intent_tag || stash.message}</p>
          <p className="mt-0.5 font-mono text-xs text-ink-faint">
            {stash.branch} · {stash.hash.slice(0, 8)}
          </p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(stash.diff)}
          className="rounded-sm border border-border px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-amber-dim hover:text-amber"
        >
          Copy diff
        </button>
      </div>

      {stash.content_summary && (
        <p className="border-b border-border-subtle bg-base px-4 py-2.5 text-sm text-ink-muted">
          {stash.content_summary}
        </p>
      )}

      <pre className="flex-1 overflow-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className={`whitespace-pre px-2 ${LINE_STYLES[classifyLine(line)]}`}>
            {line || ' '}
          </div>
        ))}
      </pre>
    </div>
  );
}
