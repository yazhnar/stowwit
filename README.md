# sto(W)it

[![License: MIT](https://img.shields.io/badge/License-MIT-8A6A3C.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.18-8A6A3C.svg)](https://nodejs.org)
[![CI](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/stowwit/ci.yml?branch=main&label=CI)](../../actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-8A6A3C.svg)](../../pulls)

**Your Git stashes, indexed by intent — not by number.**

`git stash list` gives you `stash@{3}: WIP on main: 8f2a1bc quick fix`. Six months
later, that tells you nothing. stowwit reads the actual diff, asks an AI model
what the change *does*, and gives you a searchable, one-line summary instead —
entirely on your own machine if you want it that way.

```
$ stowwit list

stash@{0}   fix: auth redirect loop after logout      feature/auth-cleanup
            Removes a stale redirect check in the logout handler that sent
            users back to the login page even after a successful sign-out.

stash@{1}   wip: pagination cursor refactor           main
            Replaces offset-based pagination with a cursor param; API client
            changes are incomplete.
```

## Why

- **Local-first by default.** Point stowwit at [Ollama](https://ollama.com) and
  every diff, message, and summary stays on your machine — nothing is sent
  anywhere. This matters for teams that can't paste proprietary diffs into a
  cloud tool, not just for personal preference.
- **Bring your own provider.** Swap to Gemini or Claude with one environment
  variable if you'd rather trade privacy for a stronger model.
- **One engine, three surfaces.** The same local engine powers a terminal CLI,
  a VS Code extension, and a standalone desktop app — index once, browse
  however you're already working.

## How it works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│     CLI     │     │ VS Code Ext │     │  Desktop App │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                            │  localhost:3000
                    ┌───────▼────────┐
                    │  @stowwit/core  │
                    │  Express + Git  │
                    │  + SQLite + AI  │
                    └───────┬────────┘
                            │
                  ┌─────────┴─────────┐
                  │                   │
            ┌─────▼─────┐     ┌───────▼──────┐
            │  Ollama    │     │ Gemini/Claude │
            │  (local)   │     │  (cloud)      │
            └────────────┘     └───────────────┘
```

`@stowwit/core` is the only package with real logic: it shells out to `git`
to list stashes and pull diffs, stores an indexed summary per stash in a local
SQLite file, and routes summarization requests to whichever AI provider you've
configured. The CLI, VS Code extension, and desktop app are thin clients that
all talk to this one local engine.

## Packages

| Package                        | What it is                                              |
| ------------------------------- | -------------------------------------------------------- |
| `packages/core`                 | Node/TS engine: Express API, git integration, SQLite, AI router |
| `packages/ui`                   | React + Tailwind + Vite frontend, shared by desktop & VS Code |
| `packages/cli`                  | `stowwit` terminal command (Commander.js)                |
| `packages/vscode-extension`     | Thin VS Code webview host for the shared UI              |
| `packages/desktop`              | Tauri desktop shell for the shared UI                     |

## Getting started

**Requirements:** Node.js ≥ 18.18, git, and (for local AI) [Ollama](https://ollama.com) running with a model pulled, e.g. `ollama pull qwen2.5-coder`.

```bash
git clone https://github.com/YOUR_USERNAME/stowwit.git
cd stowwit
npm install

# Configure the engine
cp packages/core/.env.example packages/core/.env
# Edit packages/core/.env — set REPO_PATH to the repo you want indexed,
# and LLM_PROVIDER (ollama | gemini | claude)

# Run the engine + UI together
npm run dev
```

Open `http://localhost:5173`, hit **Sync stashes**, and start searching.

### Using the CLI

```bash
npm run build:cli
npm link --workspace=packages/cli   # exposes the `stowwit` command locally

stowwit sync
stowwit list
```

### Choosing an AI provider

Set `LLM_PROVIDER` in `packages/core/.env`:

| Value    | Where it runs                        | Requires                        |
| -------- | ------------------------------------- | -------------------------------- |
| `ollama` | Fully local — nothing leaves your machine | Ollama running on `:11434` |
| `gemini` | Google's cloud API                    | `GEMINI_API_KEY`                 |
| `claude` | Anthropic's cloud API                 | `ANTHROPIC_API_KEY`              |

For any team or codebase where diffs can't leave the building, `ollama` is the
point of the project — a fast local model like `qwen2.5-coder` is enough for
short summarization prompts and keeps every line of every stash on-disk, on
your machine, indexed by a database file you control.

## Contributing

Issues and PRs are welcome. Please open an issue before starting large
changes so we can talk through approach first.

## License

MIT — see [LICENSE](./LICENSE).
