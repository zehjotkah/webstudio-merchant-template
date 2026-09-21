// Lists every instance as "id  depth  tag/component  label" (paging through list-instances).
//   node webstudio/instances.mjs [labelFilter]
import { execFileSync } from 'node:child_process';
const call = (input) => {
  const out = execFileSync('npx', ['-y', 'webstudio@latest', 'mcp', 'single-op-call', 'list-instances', JSON.stringify(input)],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
  return JSON.parse(out.slice(out.indexOf('{'))).data;
};
const all = [];
let cursor;
do {
  const page = call({ verbose: true, limit: 200, ...(cursor ? { cursor } : {}) });
  all.push(...page.instances);
  cursor = page.nextCursor;
} while (cursor);
const byId = new Map(all.map((i) => [i.id, i]));
const filter = process.argv[2]?.toLowerCase();
for (const i of all) {
  const label = i.label ?? i.record?.label ?? '';
  if (filter && !label.toLowerCase().includes(filter)) continue;
  const parent = byId.get(i.parentId);
  console.log(`${i.id}\t${i.depth}\t${i.tag ?? i.component}\t${label}\t<- ${parent?.label ?? parent?.record?.label ?? parent?.tag ?? ''}`);
}
