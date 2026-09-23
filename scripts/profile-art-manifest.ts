import { readdir, writeFile } from 'node:fs/promises';
const root = new URL('../public/profile-art/', import.meta.url);
const styles = new Set(['flexible', 'aggressive', 'stable', 'lategame']);
const manifest: Record<string, Record<string, string>> = {};
for (const folder of (await readdir(root, { withFileTypes: true })).sort((a, b) =>
  a.name.localeCompare(b.name),
)) {
  if (!folder.isDirectory() || !/^[a-z0-9-]+$/.test(folder.name)) continue;
  for (const file of (await readdir(new URL(folder.name + '/', root))).sort()) {
    const style = file.replace(/\.webp$/, '');
    if (!file.endsWith('.webp') || !styles.has(style)) continue;
    (manifest[folder.name] ??= {})[style] = `/profile-art/${folder.name}/${file}`;
  }
}
await writeFile(
  new URL('../src/profile-card/artwork-manifest.json', import.meta.url),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(`Profile artwork: ${Object.keys(manifest).length} champions`);
