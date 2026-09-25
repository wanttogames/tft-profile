import type { Store } from './supabase';
export const OFFICIAL_PATCH_LIST =
  'https://teamfighttactics.leagueoflegends.com/en-us/news/tags/patch-notes/';
export interface OfficialPatch {
  patch: string;
  sourceUrl: string;
  publishedAt: string;
}
/** Parse the actual Riot __NEXT_DATA__ article-card schema, not game_version.
 * Publication is provenance only: it is NEVER treated as KR rollout completion. */
export function parseOfficialPatch(html: string, now = Date.now()): OfficialPatch {
  const embedded = /<script\b[^>]*\bid="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1];
  if (!embedded) throw Error('Official TFT page schema changed');
  const candidates: OfficialPatch[] = [];
  function walk(value: unknown) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    const o = value as Record<string, any>;
    const match = /^Teamfight Tactics patch (\d{1,2})\.(\d{1,2})$/i.exec(o.title ?? '');
    if (
      match &&
      o.product?.machineName === 'teamfight_tactics' &&
      o.category?.machineName === 'game_updates' &&
      Array.isArray(o.tags) &&
      o.tags.some((t: any) => t?.machineName === 'patch_notes')
    ) {
      const patch = `${Number(match[1])}.${Number(match[2])}`;
      const url = new URL(o.action?.payload?.url ?? '', OFFICIAL_PATCH_LIST);
      const published = Date.parse(o.publishedAt);
      if (
        url.origin === new URL(OFFICIAL_PATCH_LIST).origin &&
        url.pathname ===
          `/en-us/news/game-updates/teamfight-tactics-patch-${Number(match[1])}-${Number(match[2])}` &&
        Number.isFinite(published) &&
        published <= now &&
        now - published <= 45 * 86400000
      )
        candidates.push({
          patch,
          sourceUrl: url.href,
          publishedAt: new Date(published).toISOString(),
        });
    }
    Object.values(o).forEach(walk);
  }
  walk(JSON.parse(embedded));
  candidates.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  if (!candidates[0]) throw Error('No recent official TFT patch article');
  return candidates[0];
}
export async function loadOfficialPatch(fetcher = fetch): Promise<OfficialPatch> {
  const response = await fetcher(OFFICIAL_PATCH_LIST, {
    signal: AbortSignal.timeout(12000),
    redirect: 'error',
  });
  if (!response.ok) throw Error(`Official TFT source HTTP ${response.status}`);
  const html = await response.text();
  if (html.length > 3_000_000) throw Error('Official TFT response too large');
  return parseOfficialPatch(html);
}
/** Failure leaves primary-source refresh usable; no secret or response body is logged. */
export async function prepareOfficialPatch(store: Pick<Store, 'request'>, fetcher = fetch) {
  const probe = (await store.request('rpc/tft_meta_patch_probe', 'POST', {}, 1)) as {
    needsFallback?: boolean;
  };
  if (probe?.needsFallback !== true) return;
  let source: OfficialPatch;
  try {
    source = await loadOfficialPatch(fetcher);
  } catch {
    console.warn(
      '[patch][official-unavailable] Official TFT fallback unavailable; no inferred patch written',
    );
    return;
  }
  // DB/RPC failures are not source outages: let the normal stage diagnostics
  // report them and stop cleanup rather than hiding a migration/permission error.
  const registered = await store.request(
    'rpc/register_tft_external_patch',
    'POST',
    {
      proposed_patch: source.patch,
      source_url: source.sourceUrl,
      published_at: source.publishedAt,
    },
    1,
  );
  console.log('[patch][official]', registered);
}
