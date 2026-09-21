// Fetches Merchant's admin dashboard (github.com/ygwyg/merchant/tree/main/admin) at a pinned
// commit and builds it into ./dist. Runs on `npm install` (postinstall), so Cloudflare's build
// does it too. This repository ships no copy of the dashboard.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const REPO = 'https://github.com/ygwyg/merchant.git';
const COMMIT = '1b42cbb7f5c8efaa943f68153cf6922ef6d1903b';
if (existsSync('dist/.pinned') && readFileSync('dist/.pinned', 'utf8') === COMMIT) process.exit(0);

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });
rmSync('upstream', { recursive: true, force: true });
run('git', ['init', '-q', 'upstream']);
run('git', ['fetch', '-q', '--depth', '1', REPO, COMMIT], 'upstream');
run('git', ['checkout', '-q', 'FETCH_HEAD'], 'upstream');
run('npm', ['install', '--no-audit', '--no-fund'], 'upstream/admin');
run('npm', ['run', 'build'], 'upstream/admin');
rmSync('dist', { recursive: true, force: true });
cpSync('upstream/admin/dist', 'dist', { recursive: true });
writeFileSync('dist/.pinned', COMMIT);
console.log(`Merchant admin ${COMMIT.slice(0, 7)} built into ./dist`);
