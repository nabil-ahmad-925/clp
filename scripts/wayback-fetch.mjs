// Downloads the latest Wayback Machine capture of each URL listed in a file into scripts/.cache/wayback.
//
//   node scripts/wayback-fetch.mjs <url-list.txt>
//
// competelikepros.com blocks scripted (and many regional) requests, so page content comes from the
// Internet Archive. The list holds one URL per line, with or without scheme ("competelikepros.com/x/").
// scripts/.cache/wayback/latest.json maps each URL to its real captures, newest first (built from the CDX
// API, skipping captures under 10 KB, which are the host's bot-check page rather than the site).
// Requests are spaced out: the archive refuses connections for a while after bursts.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const cacheDir = path.join(root, 'scripts/.cache/wayback');
const latest = JSON.parse(fs.readFileSync(path.join(cacheDir, 'latest.json'), 'utf8'));
const DELAY_MS = 8000;

/** Stylesheets and scripts are stored under their own file name; pages as <path>/index.html. */
const ASSET = /\.(css|js)$/;
const norm = (u) => {
  let k = u.trim().replace(/^https?:\/\/(www\.)?/, '').split('#')[0];
  if (ASSET.test(k.split('?')[0])) return k.split('?')[0];
  if (!k.includes('?') && !k.endsWith('/')) k += '/';
  return k;
};
/** Cache file for a URL key, e.g. "competelikepros.com/a/b/" -> "competelikepros.com/a/b/index.html". */
export const cacheFile = (key) =>
  ASSET.test(key)
    ? path.join(cacheDir, key)
    : path.join(cacheDir, key.replace(/\?/g, '__q__').replace(/[^\w./-]/g, '_'), 'index.html');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetches one capture. While the archive refuses connections (its rate-limit block) this keeps waiting;
 * HTTP 5xx is retried a few times before the capture is treated as broken (returns null).
 */
async function fetchOne(timestamp, original) {
  const url = `https://web.archive.org/web/${timestamp}id_/${original}`;
  let serverErrors = 0;
  for (let blocked = 0; blocked < 20; ) {
    let res;
    try {
      res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(90000) });
    } catch (err) {
      blocked++;
      console.log(`  archive unreachable (${err.cause?.code || err.message}), waiting 2 min`);
      await sleep(120000);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      if (res.status >= 500 && ++serverErrors >= 3) return null;
      console.log(`  HTTP ${res.status} for ${original}, waiting 1 min`);
      await sleep(60000);
      continue;
    }
    if (res.status !== 200) return null;
    const body = await res.text();
    // The host's bot check ("One moment, please...") was archived instead of the page for some captures.
    if (body.includes('<title>One moment, please...</title>')) return null;
    return body;
  }
  throw new Error('archive unreachable');
}

/** Newest usable capture of a URL, falling back to older captures when one is broken. */
async function fetchCapture(key) {
  // URLs missing from the index (stylesheets, other assets) use the capture closest to mid-2026.
  for (const [timestamp, original] of latest[key] || [['20260601000000', 'https://' + key.replace(/\/$/, '')]]) {
    const body = await fetchOne(timestamp, original);
    if (body) return { timestamp, body };
    console.log(`  capture ${timestamp} of ${key} unusable, trying an older one`);
    await sleep(DELAY_MS);
  }
  throw new Error('no usable capture');
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  const keys = [...new Set(fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map(norm))];
  let saved = 0;
  const skipped = [];
  for (const key of keys) {
    const file = cacheFile(key);
    if (fs.existsSync(file)) continue;
    if (!latest[key] && !ASSET.test(key)) {
      skipped.push(key);
      continue;
    }
    try {
      const { timestamp, body } = await fetchCapture(key);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, ASSET.test(key) ? `/* wayback ${timestamp} */\n${body}` : `<!-- wayback ${timestamp} -->\n${body}`);
      saved++;
      console.log(`saved ${key} (${timestamp})`);
    } catch (err) {
      console.log(`FAILED ${key} (${err.message})`);
    }
    await sleep(DELAY_MS);
  }
  console.log(`wayback-fetch: saved ${saved}; not archived: ${skipped.length}`);
  if (skipped.length) console.log('  ' + skipped.join('\n  '));
}
