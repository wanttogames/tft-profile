const privateValues = new Set<string>();
export function protect(value: unknown) {
  if (typeof value === 'string' && value.length) privateValues.add(value);
}
function scrub(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[nested data omitted]';
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      if (parsed && typeof parsed === 'object') return JSON.stringify(scrub(parsed, depth + 1));
    } catch {
      /* Plain error text. */
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => scrub(item, depth + 1));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /^(puuid|riotIdGameName|riotIdTagline|api_key|apikey|authorization)$/i.test(key)
          ? '[REDACTED]'
          : scrub(item, depth + 1),
      ]),
    );
  return value;
}
export function redact(value: unknown): string {
  const safe = scrub(value);
  let output = typeof safe === 'string' ? safe : (JSON.stringify(safe) ?? String(safe));
  for (const key of ['RIOT_API_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_URL'])
    protect(process.env[key]);
  for (const secret of [...privateValues].sort((a, b) => b.length - a.length))
    output = output.split(secret).join('[REDACTED]');
  output = output.replace(
    /("(?:puuid|riotIdGameName|riotIdTagline|api_key|apikey|authorization)"\s*:\s*")[^"]*(")/gi,
    '$1[REDACTED]$2',
  );
  return output.replace(/RGAPI-[\w-]+|sb_secret_[\w-]+|eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[REDACTED]');
}
export class StageError extends Error {
  constructor(
    public category: string,
    public context: Record<string, unknown>,
  ) {
    super(String(context.message ?? context.reason ?? category));
  }
}
export class ValidationError extends StageError {
  constructor(field: string, reason: string) {
    super('VALIDATION ERROR', { stage: 'Match schema/field validation', field, reason });
  }
}
export function logError(error: unknown, context: Record<string, unknown> = {}) {
  const category = error instanceof StageError ? error.category : 'COLLECTOR ERROR';
  const detail =
    error instanceof StageError
      ? error.context
      : { message: error instanceof Error ? error.message : String(error) };
  console.error(`[${category}] ${redact({ ...context, ...detail })}`);
}
// Only structural types/counts, never field values or participant identity.
export function responseShape(raw: unknown) {
  const row = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  const fields = (v: unknown, names: string[]) =>
    Object.fromEntries(
      names.map((name) => {
        const x = row(v)[name];
        return [
          name,
          x === undefined
            ? 'missing'
            : x === null
              ? 'null'
              : Array.isArray(x)
                ? `array(${x.length})`
                : typeof x,
        ];
      }),
    );
  const root = row(raw),
    info = row(root.info);
  const participants = Array.isArray(info.participants) ? info.participants : [];
  return {
    metadata: fields(root.metadata, ['match_id']),
    info: fields(info, ['game_datetime', 'game_version', 'queue_id', 'participants']),
    participants: participants.map((p, index) => {
      const r = row(p);
      protect(r.puuid);

      return {
        index,
        fields: fields(p, [
          'puuid',
          'placement',
          'level',
          'last_round',
          'players_eliminated',
          'total_damage_to_players',
          'units',
          'traits',
        ]),
        units: (Array.isArray(r.units) ? r.units : []).map((u) =>
          fields(u, ['character_id', 'tier', 'rarity', 'itemNames', 'item_names']),
        ),
        traits: (Array.isArray(r.traits) ? r.traits : []).map((t) =>
          fields(t, ['name', 'num_units', 'tier_current', 'tier_total']),
        ),
      };
    }),
  };
}
