#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';

const API_BASE = process.env.STOWWIT_API || 'http://localhost:3000';

interface IndexedStash {
  stash_id: string;
  branch: string;
  intent_tag: string;
  content_summary: string;
  timestamp: string;
}

const program = new Command();

program
  .name('stowwit')
  .description('Semantic manager and indexer for Git stashes')
  .version('0.1.0');

program
  .command('sync')
  .description('Scan git stashes, summarize new ones with AI, and update the local index')
  .action(async () => {
    console.log(chalk.dim('Syncing with local stowwit engine...'));
    try {
      const res = await fetch(`${API_BASE}/api/sync`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
      }
      const data = (await res.json()) as { synced: number };
      console.log(chalk.green(`✓ Synced ${data.synced} stash${data.synced === 1 ? '' : 'es'}.`));
    } catch (err) {
      failWithEngineHint(err);
    }
  });

program
  .command('list')
  .description('List indexed stashes with their AI-generated intent tags')
  .action(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stashes`);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = (await res.json()) as { stashes: IndexedStash[] };

      if (data.stashes.length === 0) {
        console.log(chalk.dim('No indexed stashes yet. Run `stowwit sync` first.'));
        return;
      }

      for (const stash of data.stashes) {
        console.log(
          `${chalk.yellow(stash.stash_id.padEnd(12))} ${chalk.cyan(stash.intent_tag.padEnd(32))} ${chalk.dim(stash.branch)}`
        );
        if (stash.content_summary) {
          console.log(`  ${chalk.gray(stash.content_summary)}`);
        }
      }
    } catch (err) {
      failWithEngineHint(err);
    }
  });

function failWithEngineHint(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`✗ ${message}`));
  console.error(chalk.dim(`  Is the stowwit core engine running? Try: npm run dev:core`));
  process.exitCode = 1;
}

program.parse();
