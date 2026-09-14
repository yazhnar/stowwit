import type { AIProvider, LLMProviderName } from './types.js';

const SYSTEM_PROMPT = `You are an assistant that reads a git stash's message, branch name, and raw diff, then produces two things:
1. "intent_tag": a short (max 6 words) human-readable label describing WHAT the change does or WHY it was stashed, written like a conventional commit subject (e.g. "fix: auth redirect loop", "wip: pagination refactor").
2. "content_summary": one or two plain-English sentences describing the substance of the change — what files/areas it touches and the apparent goal.

Respond with ONLY a JSON object of the shape: {"intent_tag": string, "content_summary": string}. No markdown, no preamble.`;

function buildUserPrompt(input: { message: string; branch: string; diff: string }): string {
  // Truncate huge diffs so we stay within reasonable token/context limits across all providers.
  const MAX_DIFF_CHARS = 6000;
  const diff =
    input.diff.length > MAX_DIFF_CHARS
      ? `${input.diff.slice(0, MAX_DIFF_CHARS)}\n... [diff truncated for summarization]`
      : input.diff;

  return `Branch: ${input.branch}\nStash message: ${input.message}\n\nDiff:\n${diff}`;
}

function parseJsonResponse(raw: string): { intent_tag: string; content_summary: string } {
  const cleaned = raw.trim().replace(/^```json\s*|```$/g, '');
  try {
    const parsed = JSON.parse(cleaned);
    return {
      intent_tag: String(parsed.intent_tag ?? 'untagged change'),
      content_summary: String(parsed.content_summary ?? '')
    };
  } catch {
    // Fall back gracefully rather than failing the whole sync if a model returns malformed JSON.
    return { intent_tag: 'untagged change', content_summary: cleaned.slice(0, 280) };
  }
}

/** Fully local provider — talks to an Ollama daemon on the user's machine. Nothing leaves the host. */
class OllamaProvider implements AIProvider {
  private host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  private model = process.env.OLLAMA_MODEL || 'qwen2.5-coder';

  async summarize(input: { message: string; branch: string; diff: string }) {
    const res = await fetch(`${this.host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: `${SYSTEM_PROMPT}\n\n${buildUserPrompt(input)}`,
        stream: false,
        format: 'json'
      })
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { response: string };
    return parseJsonResponse(data.response);
  }
}

/** Cloud provider — Google Gemini. Diff content is sent to Google's API. */
class GeminiProvider implements AIProvider {
  private apiKey = process.env.GEMINI_API_KEY;
  private model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  async summarize(input: { message: string; branch: string; diff: string }) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Required when LLM_PROVIDER=gemini.');
    }

    // Lazy import so the dependency is only required when this provider is actually selected.
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.model });

    const result = await model.generateContent(
      `${SYSTEM_PROMPT}\n\n${buildUserPrompt(input)}`
    );

    return parseJsonResponse(result.response.text());
  }
}

/** Cloud provider — Anthropic Claude. Diff content is sent to Anthropic's API. */
class ClaudeProvider implements AIProvider {
  private apiKey = process.env.ANTHROPIC_API_KEY;
  private model = process.env.CLAUDE_MODEL || 'claude-3-5-haiku-latest';

  async summarize(input: { message: string; branch: string; diff: string }) {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set. Required when LLM_PROVIDER=claude.');
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: this.apiKey });

    const message = await client.messages.create({
      model: this.model,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(input) }]
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    return parseJsonResponse(textBlock && 'text' in textBlock ? textBlock.text : '{}');
  }
}

const providers: Record<LLMProviderName, () => AIProvider> = {
  ollama: () => new OllamaProvider(),
  gemini: () => new GeminiProvider(),
  claude: () => new ClaudeProvider()
};

/** Router: picks the active provider based on LLM_PROVIDER. Everything else in the app is provider-agnostic. */
export function getAIProvider(): AIProvider {
  const providerName = (process.env.LLM_PROVIDER || 'ollama') as LLMProviderName;
  const factory = providers[providerName];

  if (!factory) {
    throw new Error(
      `Unknown LLM_PROVIDER "${providerName}". Expected one of: ${Object.keys(providers).join(', ')}`
    );
  }

  return factory();
}
