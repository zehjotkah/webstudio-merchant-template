// Writes webstudio/bridge.js into the "Shop Bridge" HTML Embed (Header slot) of the linked project.
//   node webstudio/sync-bridge.mjs --embed=<id> [--project=<saved project id>] [--dry-run]
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const run = (tool, input) => {
  writeFileSync('.temp/call.json', JSON.stringify(input));
  const args = ['-y', 'webstudio@latest', 'mcp', 'single-op-call', tool, '--input-file', '.temp/call.json'];
  if (project) args.push('--project', project);
  if (process.argv.includes('--dry-run') && tool !== 'search-project') args.push('--dry-run');
  let out;
  try { out = execFileSync('npx', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 }); }
  catch (error) { out = error.stdout; }
  const result = JSON.parse(out.slice(out.indexOf('{')));
  if (!result.ok) throw new Error(`${tool}: ${JSON.stringify(result.error)}`);
  return result.data;
};

// --project=<id> targets another saved project (e.g. the template copy) without relinking this folder.
const project = process.argv.find((a) => a.startsWith('--project='))?.slice(10);
const source = readFileSync('webstudio/bridge.js', 'utf8');
if (source.includes('</script')) throw new Error('bridge.js must not contain "</script"');
const embedId = process.argv.find((a) => a.startsWith('--embed='))?.slice(8);
if (!embedId) throw new Error('Pass --embed=<Shop Bridge instance id> (see: node webstudio/instances.mjs "shop bridge")');

run('update-props', { updates: [{ instanceId: embedId, name: 'code', type: 'string', value: `<script>\n${source}</script>` }] });
console.log(`Shop Bridge updated (${Math.round(source.length / 1024)} KB)`);
