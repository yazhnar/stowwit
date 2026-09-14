import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { RawStash } from './types.js';

const execFileAsync = promisify(execFile);

const REPO_PATH = process.env.REPO_PATH || process.cwd();

async function runGit(args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd: REPO_PATH,
      maxBuffer: 1024 * 1024 * 32 // 32MB ceiling for large diffs
    });
    return stdout;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`git ${args.join(' ')} failed: ${message}`);
  }
}

/**
 * Parses `git stash list` output.
 * Default format looks like:
 *   stash@{0}: On feature/auth: wip debugging redirect loop
 *   stash@{1}: WIP on main: 3f2a1bc quick fix attempt
 */
export async function listStashes(): Promise<RawStash[]> {
  // %gd = reflog selector (stash@{n}), %H = full hash, %gs = reflog subject (the stash line)
  const format = '%gd%x1f%H%x1f%gs%x1e';
  const raw = await runGit(['stash', 'list', `--pretty=format:${format}`]);

  if (!raw.trim()) return [];

  return raw
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [ref, hash, subject] = entry.split('\x1f');
      const indexMatch = ref.match(/\{(\d+)\}/);
      const index = indexMatch ? parseInt(indexMatch[1], 10) : 0;

      // subject is typically "On <branch>: <message>" or "WIP on <branch>: <shorthash> <message>"
      const onMatch = subject.match(/^(?:On|WIP on) ([^:]+):\s*(.*)$/);
      const branch = onMatch ? onMatch[1].trim() : 'unknown';
      const message = onMatch ? onMatch[2].trim() : subject.trim();

      return { ref, index, branch, message, hash };
    });
}

/** Fetches the raw diff for a given stash reference, e.g. "stash@{0}". */
export async function getStashDiff(ref: string): Promise<string> {
  return runGit(['diff', ref]);
}

/** Confirms REPO_PATH is actually inside a git working tree before we try anything else. */
export async function assertGitRepo(): Promise<void> {
  await runGit(['rev-parse', '--is-inside-work-tree']);
}
