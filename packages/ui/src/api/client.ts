import type { IndexedStash } from '../types';

// Relative paths so this works identically in the Vite dev server (proxied),
// the static build served by the Tauri desktop shell, and the VS Code webview
// (which loads the same build against the local core engine on :3000).
const BASE = '/api';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchStashes(): Promise<IndexedStash[]> {
  const res = await fetch(`${BASE}/stashes`);
  const data = await handle<{ stashes: IndexedStash[] }>(res);
  return data.stashes;
}

export async function searchStashes(query: string): Promise<IndexedStash[]> {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}`);
  const data = await handle<{ stashes: IndexedStash[] }>(res);
  return data.stashes;
}

export async function triggerSync(): Promise<{ synced: number; stashes: IndexedStash[] }> {
  const res = await fetch(`${BASE}/sync`, { method: 'POST' });
  return handle(res);
}
