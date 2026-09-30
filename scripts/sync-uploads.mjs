// Keeps public/uploads and src/content/local-uploads.json in sync. Runs automatically before `dev` and `build`.
//
//   node scripts/sync-uploads.mjs                 # just refresh the manifest
//   node scripts/sync-uploads.mjs <mirror-folder> # first copy a saved copy of the site's media into public/uploads
//
// <mirror-folder> can be a whole-site mirror (containing competelikepros.com/wp-content/uploads),
// a wp-content folder, or an uploads folder. Existing files are kept, new ones are added.
// Every image the site references is served from public/uploads when the file is there,
// and from https://competelikepros.com/wp-content/uploads otherwise (see upload() in src/content/site.ts).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const publicUploads = path.join(root, 'public/uploads');
const manifestPath = path.join(root, 'src/content/local-uploads.json');
const contentDir = path.join(root, 'src/content');

/** All files under dir, as '/2024/03/file.png' style paths (dotfiles skipped). */
function listFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full, base) : ['/' + path.relative(base, full).split(path.sep).join('/')];
  });
}

// 1. Optional: copy media from a mirror folder.
const mirrorArg = process.argv[2];
if (mirrorArg) {
  const mirror = path.resolve(mirrorArg);
  const source = [
    path.join(mirror, 'competelikepros.com/wp-content/uploads'),
    path.join(mirror, 'wp-content/uploads'),
    path.join(mirror, 'uploads'),
    mirror,
  ].find((dir) => fs.existsSync(dir) && fs.statSync(dir).isDirectory());
  let copied = 0;
  for (const file of listFiles(source)) {
    const dest = path.join(publicUploads, file);
    if (fs.existsSync(dest)) continue;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(source, file), dest);
    copied++;
  }
  console.log(`sync-uploads: copied ${copied} new file(s) from ${source}`);
}

// 2. Write the manifest of local files.
const local = listFiles(publicUploads).sort();
fs.writeFileSync(manifestPath, JSON.stringify(local, null, 2) + '\n');

// 3. Report which referenced images are still loaded from the live site.
const referenced = new Set();
for (const file of fs.readdirSync(contentDir).filter((f) => f.endsWith('.ts'))) {
  const src = fs.readFileSync(path.join(contentDir, file), 'utf8');
  for (const m of src.matchAll(/['"`](\/\d{4}\/\d{2}\/[^'"`$]+)['"`]/g)) referenced.add(m[1]);
}
// Generated page data (src/content/data/*.json) references images as "upload:/YYYY/MM/file".
const dataDir = path.join(contentDir, 'data');
for (const file of fs.existsSync(dataDir) ? fs.readdirSync(dataDir).filter((f) => f.endsWith('.json')) : []) {
  const src = fs.readFileSync(path.join(dataDir, file), 'utf8');
  for (const m of src.matchAll(/upload:(\/\d{4}\/\d{2}\/[^"'\s)\\]+)/g)) referenced.add(m[1]);
}
const localSet = new Set(local);
const missing = [...referenced].filter((p) => !localSet.has(p)).sort();
fs.writeFileSync(path.join(root, 'scripts/missing-uploads.txt'), missing.join('\n') + (missing.length ? '\n' : ''));
console.log(
  `sync-uploads: ${referenced.size - missing.length}/${referenced.size} referenced images served from public/uploads` +
    (missing.length ? `, ${missing.length} still from the live site (see scripts/missing-uploads.txt)` : ''),
);
