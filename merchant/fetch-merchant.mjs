// Fetches Merchant (https://github.com/ygwyg/merchant) at a pinned commit into ./upstream and
// applies merchant.patch. Runs on `npm install` (postinstall), so Cloudflare's build does it too.
// This repository ships only the patch, never a copy of Merchant.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const REPO = 'https://github.com/ygwyg/merchant.git';
const COMMIT = '1b42cbb7f5c8efaa943f68153cf6922ef6d1903b';
const DIR = 'upstream';
const MARKER = `${DIR}/.pinned`;

const patch = readFileSync('merchant.patch', 'utf8');
const stamp = `${COMMIT}\n${patch.length}`;
if (existsSync(MARKER) && readFileSync(MARKER, 'utf8') === stamp) process.exit(0);

const git = (...args) => execFileSync('git', args, { cwd: DIR, stdio: 'inherit' });
rmSync(DIR, { recursive: true, force: true });
execFileSync('git', ['init', '-q', DIR], { stdio: 'inherit' });
git('fetch', '-q', '--depth', '1', REPO, COMMIT);
git('checkout', '-q', 'FETCH_HEAD');
git('apply', '../merchant.patch');
writeFileSync(MARKER, stamp);
console.log(`Merchant ${COMMIT.slice(0, 7)} fetched and patched`);
