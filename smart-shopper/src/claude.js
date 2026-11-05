// Thin wrapper around the user's installed Claude Code CLI (`claude -p`).
// It authenticates with the user's existing `claude login` session — no API key needed.
import { spawn } from 'node:child_process';

const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';
const MODEL = process.env.CLAUDE_MODEL || 'sonnet';
const TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS || 240_000);

export function extractJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) { try { return JSON.parse(text.slice(start, end + 1)); } catch {} }
  return null;
}

/** Run one headless Claude task that may use web tools and must return JSON matching `schema`. */
export function askClaudeJson({ prompt, schema, tools = 'WebSearch,WebFetch', signal }) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p',
      '--output-format', 'json',
      '--json-schema', JSON.stringify(schema),
      '--tools', tools,
      '--allowedTools', ...tools.split(','),
      '--no-session-persistence',
      '--model', MODEL,
    ];
    // Make sure the CLI uses the user's login rather than a stray API key.
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;

    const child = spawn(CLAUDE_BIN, args, { env, stdio: ['pipe', 'pipe', 'pipe'], signal });
    let out = '', err = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS);
    child.stdout.on('data', d => (out += d));
    child.stderr.on('data', d => (err += d));
    child.on('error', e => { clearTimeout(timer); reject(new Error(`Could not run "${CLAUDE_BIN}": ${e.message}. Install Claude Code and run \`claude login\`.`)); });
    child.on('close', code => {
      clearTimeout(timer);
      let envelope = null;
      try { envelope = JSON.parse(out); } catch {}
      if (code !== 0 && !envelope) return reject(new Error(`claude exited ${code}: ${(err || out).slice(0, 500)}`));
      if (envelope?.is_error) return reject(new Error(`claude error: ${String(envelope.result || '').slice(0, 500)}`));
      const data = envelope?.structured_output ?? extractJson(envelope?.result ?? out);
      if (!data) return reject(new Error('Claude returned no parsable JSON'));
      resolve(data);
    });
    child.stdin.end(prompt);
  });
}
