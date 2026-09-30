// Downloads every image listed in scripts/missing-uploads.txt into public/uploads.
//
//   node scripts/fetch-uploads.mjs
//
// competelikepros.com's Cloudflare firewall rejects scripted requests, so files are fetched through
// WordPress.com's image CDN (i0.wp.com), which serves the original pixels (it only strips metadata).
// Run `npm run sync-uploads` first so missing-uploads.txt is current; this script refreshes it afterwards.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const publicUploads = path.join(root, 'public/uploads');
const missing = fs
  .readFileSync(path.join(root, 'scripts/missing-uploads.txt'), 'utf8')
  .split('\n')
  .filter(Boolean);

const CDN = 'https://i0.wp.com/competelikepros.com/wp-content/uploads';
const signatures = {
  png: [0x89, 0x50, 0x4e, 0x47],
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  webp: [0x52, 0x49, 0x46, 0x46], // "RIFF"
  gif: [0x47, 0x49, 0x46],
};

async function fetchOne(file) {
  const dest = path.join(publicUploads, file);
  if (fs.existsSync(dest)) return 'exists';
  // The CDN converts .webp to JPEG unless the client says it accepts WebP (and would convert PNG/JPG to WebP if it always did).
  const headers = file.endsWith('.webp') ? { Accept: 'image/webp' } : {};
  const res = await fetch(CDN + encodeURI(file), { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const sig = signatures[path.extname(file).slice(1).toLowerCase()];
  if (!sig || !sig.every((b, i) => bytes[i] === b)) throw new Error(`not a ${path.extname(file)} file`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, bytes);
  return 'saved';
}

const failed = [];
let saved = 0;
const queue = [...missing];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    for (let file = queue.shift(); file; file = queue.shift()) {
      try {
        if ((await fetchOne(file)) === 'saved') saved++;
      } catch (err) {
        failed.push(`${file}  (${err.message})`);
      }
    }
  }),
);

console.log(`fetch-uploads: saved ${saved} of ${missing.length} file(s)`);
if (failed.length) console.log('fetch-uploads: failed:\n  ' + failed.sort().join('\n  '));

execFileSync('node', [path.join(root, 'scripts/sync-uploads.mjs')], { stdio: 'inherit' });
