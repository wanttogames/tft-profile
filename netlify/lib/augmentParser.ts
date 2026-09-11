import type { AugmentStatus } from '../../src/types/riot';

/** Discovery only: never interpret an unverified key as selected augments. */
export function augmentFields(participant: Record<string, unknown>): Record<string, unknown> {
  const found: Record<string, unknown> = {};
  function visit(value: unknown, path: string, depth: number) {
    if (!value || typeof value !== 'object' || depth > 8) return;
    for (const [key, child] of Object.entries(value)) {
      const next = path ? `${path}.${key}` : key;
      if (/augment/i.test(key)) found[next] = child;
      else visit(child, next, depth + 1);
    }
  }
  visit(participant, '', 0);
  return found;
}

/** Only augments:string[] is backed by the published response fixture.
 * Do not infer choices from missions, traits, static catalogs or unknown fields.
 */
export function parseAugments(participant: Record<string, unknown>): {
  augments?: string[];
  augmentStatus: AugmentStatus;
} {
  const fields = augmentFields(participant);
  if (Array.isArray(participant.augments)) {
    if (participant.augments.every((id) => typeof id === 'string' && id.trim().length > 0)) {
      // Preserve every slot; do not truncate to three or deduplicate selected slots.
      return {
        augments: [...participant.augments],
        augmentStatus: participant.augments.length ? 'available' : 'empty',
      };
    }
    return { augmentStatus: 'parse-error' };
  }
  if (participant.augments != null || Object.keys(fields).some((key) => key !== 'augments'))
    return { augmentStatus: 'parse-error' };
  return { augmentStatus: 'missing' };
}

export function debugAugments(participant: Record<string, unknown>) {
  // Explicit opt-in, development only. Never log PUUID, Riot ID, tokens or whole participants.
  if (process.env.NODE_ENV === 'development' && process.env.TFT_DEBUG_AUGMENTS === '1')
    console.debug('[tft:augments]', {
      fields: augmentFields(participant),
      status: parseAugments(participant).augmentStatus,
    });
}
