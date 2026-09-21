// Creates a page with the shared Craft page structure:
//   Page Wrapper → Header Slot → <main from file> → Footer Slot
//   node webstudio/page.mjs --name=Shop --path=/shop --main=webstudio/fragments/shop-main.jsx [--title=..] [--description=..]
//   node webstudio/page.mjs --root=<existing body id> --main=...   (for Home/404, which already exist)
//   add --resource=a.json,b.json to create page-scoped Resources before the main content
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const HEADER_SLOT = 'B8ifaOFHvS4LIziiMkNd3';
const FOOTER_SLOT = 'JS6iwMtk8GYJCEunyW12s';
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);

const call = (tool, input) => {
  writeFileSync('.temp/call.json', JSON.stringify(input));
  const out = execFileSync('npx', ['-y', 'webstudio@latest', 'mcp', 'single-op-call', tool, '--input-file', '.temp/call.json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
  const res = JSON.parse(out.slice(out.indexOf('{')));
  if (!res.ok) throw new Error(`${tool}: ${JSON.stringify(res.error)}`);
  return res.data;
};
const insert = (parent, file) => {
  const out = execFileSync('node', ['webstudio/insert.mjs', parent, file], { encoding: 'utf8' });
  return JSON.parse(out).rootIds[0];
};

let root = arg('root');
let pageId = arg('page');
if (!root) {
  const meta = {};
  if (arg('description')) meta.description = arg('description');
  const page = call('create-page', { name: arg('name'), path: arg('path'), ...(arg('title') ? { title: arg('title') } : {}), meta });
  pageId = page.pageId ?? page.page?.id ?? page.id;
  root = page.rootInstanceId ?? page.page?.rootInstanceId;
}
// --resource=<file.json> holds { dataSourceName, resource } and is created on the page body first,
// so the main fragment can bind to it.
for (const file of (arg('resource') ?? '').split(',').filter(Boolean)) {
  const { dataSourceName, resource } = JSON.parse(readFileSync(file, 'utf8'));
  call('create-resource', { resource, scopeInstanceId: root, dataSourceName, exposeAsDataSource: true });
}
writeFileSync('.temp/wrapper.jsx', '<div ws:label="Page Wrapper" ws:style={css`display: flex; flex-direction: column; min-height: 100dvh;`}></div>');
const wrapper = insert(root, '.temp/wrapper.jsx');
call('attach-slot', { sourceSlotId: HEADER_SLOT, parentInstanceId: wrapper });
const main = insert(wrapper, arg('main'));
call('attach-slot', { sourceSlotId: FOOTER_SLOT, parentInstanceId: wrapper });
console.log(JSON.stringify({ pageId, root, wrapper, main }));
