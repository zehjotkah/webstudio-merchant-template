// Inserts a Webstudio JSX fragment and applies existing Craft Tokens by name.
//   node webstudio/insert.mjs <parentInstanceId> <fragment.jsx> [--dry-run] [--mode=replace] [--collection=<expression>] [--index=<n>] [--project=<id>]
// Write craft="heading, heading-xl" on any element; the names must already exist as Tokens.
// conflictResolution "ours" keeps the Token definitions untouched and only attaches them.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [parent, file, ...flags] = process.argv.slice(2);
const known = new Set(JSON.parse(readFileSync('.temp/token-names.json', 'utf8')));
const source = readFileSync(file, 'utf8');

const fragment = source
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\scraft="([^"]+)"/g, (_, list) => {
    const names = list.split(',').map((n) => n.trim()).filter(Boolean);
    for (const n of names) if (!known.has(n)) throw new Error(`Unknown Craft Token "${n}" in ${file}`);
    return ` ws:tokens={[${names.map((n) => `token('${n}', css\`display: block;\`)`).join(', ')}]}`;
  })
  .trim();

// --collection=<expression> repeats the fragment once per item of that iterable.
const collection = flags.find((f) => f.startsWith('--collection='));
const tool = collection ? 'insert-collection' : 'insert-fragment';
const input = collection
  ? { parentInstanceId: parent, conflictResolution: 'ours', data: { type: 'expression', value: collection.slice(13) }, itemFragment: fragment }
  : { parentInstanceId: parent, conflictResolution: 'ours', fragment };
const mode = flags.find((f) => f.startsWith('--mode='));
if (mode) input.mode = mode.slice(7);
const index = flags.find((f) => f.startsWith('--index='));
if (index) input.insertIndex = Number(index.slice(8));
mkdirSync('.temp', { recursive: true });
writeFileSync('.temp/insert-fragment.json', JSON.stringify(input));

const args = ['-y', 'webstudio@latest', 'mcp', 'single-op-call', tool, '--input-file', '.temp/insert-fragment.json'];
// --project=<id> targets another saved project (e.g. the template copy) without relinking this folder.
const project = flags.find((f) => f.startsWith('--project='));
if (project) args.push('--project', project.slice(10));
if (flags.includes('--dry-run')) args.push('--dry-run');
let out;
try {
  out = execFileSync('npx', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
} catch (error) {
  out = error.stdout; // the CLI exits non-zero on tool errors but still prints the JSON result
}
const result = JSON.parse(out.slice(out.indexOf('{')));
if (!result.ok) { console.error(JSON.stringify(result.error, null, 2)); process.exit(1); }

// Report new style sources so a typo'd or accidentally created Token is caught immediately.
const payload = result.meta?.session?.transaction?.payload ?? [];
const created = payload.filter((n) => n.namespace === 'styleSources')
  .flatMap((n) => n.patches).filter((p) => p.value?.type === 'token').map((p) => p.value.name);
console.log(JSON.stringify({ ok: true, version: result.data?.version ?? result.meta?.session?.version,
  committed: result.meta?.session?.committed, rootIds: result.data?.rootInstanceIds ?? result.data?.instanceIds,
  newTokens: created, warnings: result.meta?.session?.diagnostics?.filter((d) => d.level !== 'info') }, null, 1));
