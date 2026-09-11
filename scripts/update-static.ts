import { writeFile, readFile } from 'node:fs/promises';
import { indexCommunityDragon } from '../src/static-data/catalog';
const version = process.env.TFT_STATIC_VERSION || 'latest';
if (!/^(latest|\d+\.\d+)$/.test(version))
  throw new Error('TFT_STATIC_VERSION must be latest or major.minor');
const local = process.argv[2];
const source = `https://raw.communitydragon.org/${version}/cdragon/tft/ko_kr.json`;
const raw = local
  ? JSON.parse(await readFile(local, 'utf8'))
  : await (async () => {
      const r = await fetch(source, { signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error(`Static data HTTP ${r.status}`);
      return r.json();
    })();
const catalog = indexCommunityDragon(raw, version);
await writeFile(
  new URL('../netlify/data/tft-ko-snapshot.json', import.meta.url),
  JSON.stringify(catalog) + '\n',
);
console.log(
  `Saved ko_KR catalog: ${Object.keys(catalog.assets).length} aliases; sets ${catalog.sets.join(', ')}; ${catalog.source}`,
);
