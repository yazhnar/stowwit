export interface RawStash {
  /** Positional reference, e.g. "stash@{0}" */
  ref: string;
  index: number;
  branch: string;
  message: string;
  hash: string;
}

export interface IndexedStash {
  stash_id: string; // "stash@{0}" — stable-ish identifier while it exists in the stash list
  hash: string; // commit hash the stash entry points to
  message: string; // raw git stash message
  branch: string; // branch the stash was created from
  content_summary: string; // AI-generated intent summary
  intent_tag: string; // short AI-generated label, e.g. "fix: auth redirect loop"
  diff: string; // raw diff, stored so search/UI don't need to re-shell out to git
  timestamp: string; // ISO 8601, when stowwit indexed this entry
}

export interface AIProvider {
  summarize(input: { message: string; branch: string; diff: string }): Promise<{
    intent_tag: string;
    content_summary: string;
  }>;
}

export type LLMProviderName = 'ollama' | 'gemini' | 'claude';
